import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const MAX_SECONDS = 5;
/** Source file may be up to 10 MB; final clip is trimmed client-side to <=5s. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_FADE_SECONDS = 1;
const DEFAULT_FADE_SECONDS = 0.25;
/** Gain applied to the exported clip (1 = original level). */
const DEFAULT_VOLUME = 1;
const MAX_VOLUME = 2;

/**
 * Encode an AudioBuffer as a mono/stereo 16-bit PCM WAV Blob.
 */
function audioBufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples * blockAlign;
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

async function decodeFileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    if (ctx.close) {
      try {
        await ctx.close();
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Slice [startSec, endSec) into a new AudioBuffer (copied samples).
 */
function sliceAudioBuffer(source, startSec, endSec) {
  const sampleRate = source.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(source.length, Math.floor(endSec * sampleRate));
  const frameCount = Math.max(0, endSample - startSample);
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const sliced = ctx.createBuffer(
      source.numberOfChannels,
      frameCount,
      sampleRate
    );
    for (let c = 0; c < source.numberOfChannels; c++) {
      const src = source.getChannelData(c).subarray(startSample, endSample);
      sliced.copyToChannel(new Float32Array(src), c);
    }
    return sliced;
  } finally {
    if (ctx.close) {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * In-place volume scale + linear fade in / fade out. Mutates channel data.
 * Samples are soft-clipped to [-1, 1] after gain to avoid hard digital wrap.
 */
function applyGainAndFades(buffer, volume, fadeInSec, fadeOutSec) {
  if (!buffer || buffer.length === 0) return buffer;
  const n = buffer.length;
  const sr = buffer.sampleRate;
  const vol = Number.isFinite(volume) ? Math.max(0, volume) : 1;
  const fadeInSamples = Math.max(
    0,
    Math.min(n, Math.floor(Math.max(0, fadeInSec) * sr))
  );
  const fadeOutSamples = Math.max(
    0,
    Math.min(n, Math.floor(Math.max(0, fadeOutSec) * sr))
  );

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) {
      let gain = vol;
      if (fadeInSamples > 0 && i < fadeInSamples) {
        gain *= i / fadeInSamples;
      }
      if (fadeOutSamples > 0 && i >= n - fadeOutSamples) {
        const remaining = n - 1 - i;
        const outGain =
          fadeOutSamples <= 1 ? 0 : remaining / (fadeOutSamples - 1);
        gain *= Math.max(0, outGain);
      }
      // Soft clip
      let s = data[i] * gain;
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      data[i] = s;
    }
  }
  return buffer;
}

/** Clamp start/end to [0, duration] only — selection may be longer than 5s while editing. */
function clampRange(start, end, duration) {
  const max = Number.isFinite(duration) && duration > 0 ? duration : 0;
  let a = Math.max(0, Math.min(max, start));
  let b = Math.max(0, Math.min(max, end));
  if (b < a) {
    const t = a;
    a = b;
    b = t;
  }
  return [a, b];
}

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0.00";
  return Number(sec).toFixed(2);
}

/** Parse a free-typed seconds field; returns null if empty/invalid. */
function parseSec(text) {
  if (text == null) return null;
  const s = String(text).trim();
  if (s === "" || s === "." || s === "-" || s === "-.") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

/**
 * Settings field: choose mp3/ogg/wav (up to 10 MB), open trim dialog,
 * optional 0.25s fades, then upload final <=5s clip.
 */
export default function DeathSoundUpload({
  disabled,
  hasDeathSound,
  deathSoundUrl,
  onUpload,
  onRemove,
  cacheVal,
}) {
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const canvasRef = useRef(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [decoded, setDecoded] = useState(null);
  const [duration, setDuration] = useState(0);
  // Numeric range drives the slider / waveform; text fields are free-typed
  const [range, setRange] = useState([0, MAX_SECONDS]);
  const [startText, setStartText] = useState("0");
  const [endText, setEndText] = useState(String(MAX_SECONDS));
  const [fadeIn, setFadeIn] = useState(true);
  const [fadeOut, setFadeOut] = useState(true);
  const [fadeInText, setFadeInText] = useState(String(DEFAULT_FADE_SECONDS));
  const [fadeOutText, setFadeOutText] = useState(String(DEFAULT_FADE_SECONDS));
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [objectUrl, setObjectUrl] = useState(null);

  const existingUrl = useMemo(() => {
    if (!hasDeathSound || !deathSoundUrl) return null;
    const t = cacheVal != null ? cacheVal : Date.now();
    return `${deathSoundUrl}?t=${t}`;
  }, [hasDeathSound, deathSoundUrl, cacheVal]);

  // Live length from free-typed fields when both parse; else fall back to slider range
  const parsedStart = parseSec(startText);
  const parsedEnd = parseSec(endText);
  const typedRangeValid =
    parsedStart != null &&
    parsedEnd != null &&
    parsedEnd >= parsedStart;
  const trimLength = typedRangeValid
    ? Math.max(0, parsedEnd - parsedStart)
    : Math.max(0, range[1] - range[0]);
  // Max allowed selection is 5s, or the full clip when the source is shorter
  const maxSelectionSec =
    duration > 0 ? Math.min(MAX_SECONDS, duration) : MAX_SECONDS;
  const endPastClip =
    typedRangeValid && duration > 0 && parsedEnd > duration + 0.001;
  const selectionTooLong =
    typedRangeValid &&
    (trimLength > maxSelectionSec + 0.05 || endPastClip);
  const mustTrim = duration > MAX_SECONDS + 0.01;

  // Keep waveform highlight in sync when typed times parse cleanly
  useEffect(() => {
    if (!dialogOpen || duration <= 0) return;
    if (parsedStart == null || parsedEnd == null) return;
    if (parsedEnd < parsedStart) return;
    if (parsedStart < 0 || parsedEnd > duration + 0.001) return;
    const next = clampRange(parsedStart, parsedEnd, duration);
    setRange((prev) =>
      Math.abs(prev[0] - next[0]) < 1e-6 && Math.abs(prev[1] - next[1]) < 1e-6
        ? prev
        : next
    );
  }, [dialogOpen, duration, parsedStart, parsedEnd]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (previewRef.current) {
        try {
          previewRef.current.pause();
        } catch {
          /* ignore */
        }
      }
    };
  }, [objectUrl]);

  // Draw a simple amplitude waveform for the full clip with selection highlight
  useEffect(() => {
    if (!dialogOpen || !decoded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 480;
    const cssH = canvas.clientHeight || 72;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssW;
    const h = cssH;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, 0, w, h);

    const channel = decoded.getChannelData(0);
    const mid = h / 2;
    const bins = Math.max(1, Math.floor(w));
    const samplesPerBin = channel.length / bins;

    // Selection region
    if (duration > 0) {
      const x0 = (range[0] / duration) * w;
      const x1 = (range[1] / duration) * w;
      ctx.fillStyle = "rgba(25, 118, 210, 0.28)";
      ctx.fillRect(x0, 0, Math.max(1, x1 - x0), h);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < bins; i++) {
      const start = Math.floor(i * samplesPerBin);
      const end = Math.floor((i + 1) * samplesPerBin);
      let peak = 0;
      for (let j = start; j < end && j < channel.length; j++) {
        const v = Math.abs(channel[j]);
        if (v > peak) peak = v;
      }
      const y = peak * (h * 0.45);
      ctx.moveTo(i + 0.5, mid - y);
      ctx.lineTo(i + 0.5, mid + y);
    }
    ctx.stroke();
  }, [dialogOpen, decoded, duration, range]);

  const stopPreview = () => {
    if (previewRef.current) {
      try {
        previewRef.current.pause();
        previewRef.current.src = "";
      } catch {
        /* ignore */
      }
      previewRef.current = null;
    }
  };

  const clearSelection = () => {
    stopPreview();
    setFile(null);
    setDecoded(null);
    setDuration(0);
    setRange([0, MAX_SECONDS]);
    setStartText("0");
    setEndText(String(MAX_SECONDS));
    setFadeIn(true);
    setFadeOut(true);
    setFadeInText(String(DEFAULT_FADE_SECONDS));
    setFadeOutText(String(DEFAULT_FADE_SECONDS));
    setVolume(DEFAULT_VOLUME);
    setError("");
    setDialogOpen(false);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /**
   * Parse + validate start/end/fade from free-typed fields.
   * Returns { ok, error?, start, end, fadeInSec, fadeOutSec } — does not mutate state.
   *
   * End cannot exceed the source clip length. Selection length cannot exceed
   * min(MAX_SECONDS, clip duration). Each fade cannot exceed selection length
   * (or MAX_FADE_SECONDS); both fades together cannot exceed selection length.
   */
  const parseEditorValues = () => {
    const a = parseSec(startText);
    const b = parseSec(endText);
    if (a == null || b == null) {
      return {
        ok: false,
        error: "Enter valid start and end times in seconds.",
      };
    }
    if (a < 0 || b < 0) {
      return { ok: false, error: "Start and end must be zero or greater." };
    }
    // End (and start) are hard-capped by the source clip length
    if (duration > 0) {
      if (a > duration + 0.001) {
        return {
          ok: false,
          error: `Start cannot exceed the clip length (${formatTime(duration)}s).`,
        };
      }
      if (b > duration + 0.001) {
        return {
          ok: false,
          error: `End cannot exceed the clip length (${formatTime(duration)}s).`,
        };
      }
    }
    if (b < a) {
      return { ok: false, error: "End must be greater than or equal to start." };
    }
    const len = b - a;
    if (len < 0.05) {
      return { ok: false, error: "Select a non-empty trim range." };
    }
    // Max selection is 5s, or the full clip if the clip itself is shorter
    const maxSelection = duration > 0 ? Math.min(MAX_SECONDS, duration) : MAX_SECONDS;
    if (len > maxSelection + 0.05) {
      return {
        ok: false,
        error: `Selection is ${formatTime(len)}s. Shorten it to ${formatTime(maxSelection)}s or less to preview or save.`,
        tooLong: true,
        start: a,
        end: b,
        length: len,
      };
    }

    let inSec = 0;
    let outSec = 0;
    // Fades cannot exceed selection length (and hard-cap at MAX_FADE_SECONDS)
    const maxFadeForClip = Math.min(MAX_FADE_SECONDS, len);

    if (fadeIn) {
      const fin = parseSec(fadeInText);
      if (fin == null) {
        return {
          ok: false,
          error: `Enter a valid fade-in length in seconds (0–${formatTime(maxFadeForClip)}).`,
        };
      }
      if (fin < 0) {
        return { ok: false, error: "Fade in cannot be negative." };
      }
      if (fin > maxFadeForClip + 0.001) {
        return {
          ok: false,
          error: `Fade in (${formatTime(fin)}s) cannot exceed the selection length (${formatTime(len)}s)${len < MAX_FADE_SECONDS ? "" : ` or ${MAX_FADE_SECONDS}s`}.`,
        };
      }
      inSec = fin;
    }
    if (fadeOut) {
      const fout = parseSec(fadeOutText);
      if (fout == null) {
        return {
          ok: false,
          error: `Enter a valid fade-out length in seconds (0–${formatTime(maxFadeForClip)}).`,
        };
      }
      if (fout < 0) {
        return { ok: false, error: "Fade out cannot be negative." };
      }
      if (fout > maxFadeForClip + 0.001) {
        return {
          ok: false,
          error: `Fade out (${formatTime(fout)}s) cannot exceed the selection length (${formatTime(len)}s)${len < MAX_FADE_SECONDS ? "" : ` or ${MAX_FADE_SECONDS}s`}.`,
        };
      }
      outSec = fout;
    }
    if (inSec + outSec > len + 0.001) {
      return {
        ok: false,
        error: `Fade in + fade out (${formatTime(inSec + outSec)}s) cannot exceed the selection length (${formatTime(len)}s).`,
      };
    }

    return {
      ok: true,
      start: a,
      end: b,
      length: len,
      fadeInSec: inSec,
      fadeOutSec: outSec,
    };
  };

  const buildProcessedBuffer = (values) => {
    if (!decoded || !values) return null;
    const [a, b] = clampRange(values.start, values.end, duration);
    if (b - a < 0.05) return null;
    const sliced = sliceAudioBuffer(decoded, a, b);
    // Hard-cap fades by selection length so they never exceed the clip
    const selLen = sliced.duration;
    const inSec = Math.min(
      Math.max(0, values.fadeInSec || 0),
      MAX_FADE_SECONDS,
      selLen
    );
    const outSec = Math.min(
      Math.max(0, values.fadeOutSec || 0),
      MAX_FADE_SECONDS,
      selLen - inSec
    );
    applyGainAndFades(sliced, volume, inSec, outSec);
    return sliced;
  };

  const handleFileChange = async (e) => {
    const next = e.target.files?.[0];
    if (!next) return;

    setError("");
    setBusy(true);
    stopPreview();
    try {
      if (next.size > MAX_UPLOAD_BYTES) {
        throw new Error("File must be under 10 MB.");
      }
      const type = (next.type || "").toLowerCase();
      const name = (next.name || "").toLowerCase();
      const okMime =
        type.includes("mpeg") ||
        type.includes("mp3") ||
        type.includes("ogg") ||
        type.includes("wav") ||
        type.includes("webm") ||
        /\.(mp3|ogg|wav|webm)$/.test(name);
      if (!okMime) {
        throw new Error("Please choose an mp3, ogg, or wav file.");
      }

      const buffer = await decodeFileToBuffer(next);
      const total = buffer.duration || 0;
      if (!total || total <= 0) {
        throw new Error("Could not read audio duration.");
      }

      // Default selection: first up to 5s (user can drag freely beyond that)
      const end = Math.min(total, MAX_SECONDS);
      setFile(next);
      setDecoded(buffer);
      setDuration(total);
      setRange([0, end]);
      setStartText(formatTime(0));
      setEndText(formatTime(end));
      setFadeIn(true);
      setFadeOut(true);
      setFadeInText(String(DEFAULT_FADE_SECONDS));
      setFadeOutText(String(DEFAULT_FADE_SECONDS));
      setVolume(DEFAULT_VOLUME);

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl(URL.createObjectURL(next));
      setDialogOpen(true);
    } catch (err) {
      clearSelection();
      setError(err.message || "Could not load audio file.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRangeSlider = (_, value) => {
    const [a, b] = clampRange(value[0], value[1], duration);
    // Slider updates both numeric range and text fields
    setRange([a, b]);
    setStartText(formatTime(a));
    setEndText(formatTime(b));
    setError("");
  };

  const handlePreviewSelection = async () => {
    setError("");
    stopPreview();
    try {
      const values = parseEditorValues();
      if (!values.ok) {
        setError(values.error);
        return;
      }
      // Sync slider/waveform to the typed values on successful parse
      setRange(clampRange(values.start, values.end, duration));

      const processed = buildProcessedBuffer(values);
      if (!processed) {
        setError("Select a non-empty trim range.");
        return;
      }
      const blob = audioBufferToWavBlob(processed);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      previewRef.current = audio;
      audio.addEventListener(
        "ended",
        () => {
          URL.revokeObjectURL(url);
        },
        { once: true }
      );
      await audio.play();
    } catch (err) {
      setError(err.message || "Preview failed.");
    }
  };

  const handleSaveUpload = async () => {
    if (!file || !decoded) {
      setError("Choose an audio file first.");
      return;
    }

    const values = parseEditorValues();
    if (!values.ok) {
      setError(values.error);
      return;
    }
    setRange(clampRange(values.start, values.end, duration));

    setBusy(true);
    setError("");
    stopPreview();
    try {
      const processed = buildProcessedBuffer(values);
      if (!processed) {
        throw new Error("Could not process audio selection.");
      }
      if (processed.duration > MAX_SECONDS + 0.05) {
        throw new Error(`Death sound must be at most ${MAX_SECONDS} seconds.`);
      }

      const blob = audioBufferToWavBlob(processed);
      // Final payload is always a short WAV; keep a soft size guard
      if (blob.size > MAX_UPLOAD_BYTES) {
        throw new Error("Processed audio is unexpectedly large. Try a shorter clip.");
      }

      const uploadFile = new File([blob], "deathSound.wav", {
        type: "audio/wav",
      });
      await onUpload(uploadFile, processed.duration);
      clearSelection();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!hasDeathSound) return;
    if (!window.confirm("Remove your custom death sound?")) return;
    setBusy(true);
    setError("");
    try {
      await onRemove();
      clearSelection();
    } catch (err) {
      setError(err.message || "Could not remove death sound.");
    } finally {
      setBusy(false);
    }
  };

  const marks =
    duration > 0
      ? [
          { value: 0, label: "0s" },
          {
            value: duration,
            label: `${formatTime(duration)}s`,
          },
        ]
      : [];

  return (
    <Stack spacing={1.25} sx={{ width: "100%", maxWidth: 520 }}>
      <Typography variant="body2" color="text.secondary">
        Upload an mp3, ogg, or wav (up to 10 MB). An editor opens so you can trim
        to at most {MAX_SECONDS} seconds, set volume, and adjust fade in/out, then
        save. Replacing a sound deletes the old file.
      </Typography>

      {hasDeathSound && existingUrl && (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2">Current death sound is set.</Typography>
          <Button
            size="small"
            variant="outlined"
            disabled={busy || disabled}
            onClick={async () => {
              try {
                stopPreview();
                const audio = new Audio(existingUrl);
                previewRef.current = audio;
                await audio.play();
              } catch {
                setError("Could not play current death sound.");
              }
            }}
          >
            Preview current
          </Button>
          <Button
            size="small"
            color="error"
            variant="text"
            disabled={busy || disabled}
            onClick={handleRemove}
          >
            Remove
          </Button>
        </Stack>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          disabled={busy || disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          {busy ? "Loading…" : "Choose file"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/webm,.mp3,.ogg,.wav,.webm"
          hidden
          onChange={handleFileChange}
        />
      </Stack>

      {error && !dialogOpen && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!busy) clearSelection();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit death sound</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {file?.name}
              {file ? ` · ${(file.size / (1024 * 1024)).toFixed(2)} MB` : ""}
              {duration > 0 ? ` · ${formatTime(duration)}s total` : ""}
              {` · selection ${formatTime(trimLength)}s`}
            </Typography>

            {mustTrim && (
              <Typography variant="body2" color="warning.main">
                This clip is longer than {MAX_SECONDS} seconds. Drag start and end
                freely; you can only save when the selection is{" "}
                {MAX_SECONDS}s or less.
              </Typography>
            )}

            <Box
              sx={{
                width: "100%",
                height: 72,
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Selection
                {duration > 0
                  ? ` (0–${formatTime(duration)}s; save requires ≤${formatTime(
                      maxSelectionSec
                    )}s)`
                  : ` (save requires ≤${MAX_SECONDS}s)`}
              </Typography>
              <Slider
                value={range}
                onChange={handleRangeSlider}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${formatTime(v)}s`}
                min={0}
                max={duration || MAX_SECONDS}
                step={0.01}
                disableSwap
                marks={marks}
                disabled={busy || duration <= 0}
              />
            </Box>

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Start (s)"
                type="text"
                size="small"
                value={startText}
                onChange={(e) => {
                  setStartText(e.target.value);
                  setError("");
                }}
                inputProps={{ inputMode: "decimal", autoComplete: "off" }}
                disabled={busy}
                fullWidth
              />
              <TextField
                label={
                  duration > 0
                    ? `End (s, max ${formatTime(duration)})`
                    : "End (s)"
                }
                type="text"
                size="small"
                value={endText}
                onChange={(e) => {
                  setEndText(e.target.value);
                  setError("");
                }}
                inputProps={{ inputMode: "decimal", autoComplete: "off" }}
                disabled={busy}
                fullWidth
              />
            </Stack>

            <Typography
              variant="body2"
              color={
                selectionTooLong
                  ? "error"
                  : !typedRangeValid
                    ? "text.secondary"
                    : "text.primary"
              }
            >
              Length:{" "}
              <strong>
                {typedRangeValid ? `${formatTime(trimLength)}s` : "—"}
              </strong>
              {duration > 0
                ? ` · clip ${formatTime(duration)}s`
                : ""}
              {endPastClip
                ? ` — end exceeds clip length (${formatTime(duration)}s)`
                : selectionTooLong
                  ? ` — too long (max ${formatTime(maxSelectionSec)}s). Shorten to preview or save.`
                  : !typedRangeValid
                    ? " — enter valid start/end"
                    : ""}
            </Typography>

            {selectionTooLong && (
              <Alert severity="warning" variant="outlined">
                {endPastClip
                  ? `End time cannot be past the clip length (${formatTime(duration)}s).`
                  : `Selection is over ${formatTime(maxSelectionSec)} seconds. Preview and upload are disabled until the range is short enough.`}
              </Alert>
            )}

            <Stack spacing={1.25}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fadeIn}
                    onChange={(e) => setFadeIn(e.target.checked)}
                    disabled={busy}
                  />
                }
                label="Fade in"
              />
              {fadeIn && (
                <TextField
                  label={`Fade in (s, max ${formatTime(
                    Math.min(
                      MAX_FADE_SECONDS,
                      typedRangeValid ? trimLength : MAX_FADE_SECONDS
                    )
                  )})`}
                  type="text"
                  size="small"
                  value={fadeInText}
                  onChange={(e) => {
                    setFadeInText(e.target.value);
                    setError("");
                  }}
                  inputProps={{ inputMode: "decimal", autoComplete: "off" }}
                  disabled={busy}
                  sx={{ maxWidth: 280, pl: 1 }}
                />
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={fadeOut}
                    onChange={(e) => setFadeOut(e.target.checked)}
                    disabled={busy}
                  />
                }
                label="Fade out"
              />
              {fadeOut && (
                <TextField
                  label={`Fade out (s, max ${formatTime(
                    Math.min(
                      MAX_FADE_SECONDS,
                      typedRangeValid ? trimLength : MAX_FADE_SECONDS
                    )
                  )})`}
                  type="text"
                  size="small"
                  value={fadeOutText}
                  onChange={(e) => {
                    setFadeOutText(e.target.value);
                    setError("");
                  }}
                  inputProps={{ inputMode: "decimal", autoComplete: "off" }}
                  disabled={busy}
                  sx={{ maxWidth: 280, pl: 1 }}
                />
              )}
            </Stack>

            <Box>
              <Typography variant="body2" gutterBottom>
                Volume: {Math.round(volume * 100)}%
              </Typography>
              <Slider
                value={volume}
                onChange={(_, v) => setVolume(Number(v))}
                min={0}
                max={MAX_VOLUME}
                step={0.05}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${Math.round(Number(v) * 100)}%`}
                marks={[
                  { value: 0, label: "0%" },
                  { value: 1, label: "100%" },
                  { value: MAX_VOLUME, label: "200%" },
                ]}
                disabled={busy}
              />
            </Box>

            <Alert severity="warning" variant="outlined">
              Clips that are excessively loud may have the death sound removed and
              can result in a site violation for abusing this feature. Keep volume
              reasonable for other players.
            </Alert>

            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button disabled={busy} onClick={clearSelection}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            disabled={busy || selectionTooLong}
            onClick={handlePreviewSelection}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            disabled={busy || selectionTooLong}
            onClick={handleSaveUpload}
          >
            {busy ? "Uploading…" : "Save & upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
