import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Slider,
} from "@mui/material";

import photographer from "images/roles/village/photographer-vivid.png";

// Banner crop viewport (matches profile aspect-ratio ~3:1)
const PREVIEW_W = 600;
const PREVIEW_H = 200;
const OUTPUT_W = 900;
const OUTPUT_H = 300;

/**
 * Banner upload with pan/zoom crop, same idea as AvatarUpload.
 * Works for any user allowed to upload a banner (static or animated add-on).
 * Cropping exports a still PNG of the framed region. Animated GIF/WebP can
 * optionally be uploaded as-is to keep animation (when keepAnimation is true).
 */
export default function BannerUpload(props) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef();
  const canvasRef = useRef();
  const imageRef = useRef();
  const previewRef = useRef();
  // Actual rendered crop viewport (shrinks on small screens; used for export math)
  const [previewSize, setPreviewSize] = useState({
    w: PREVIEW_W,
    h: PREVIEW_H,
  });

  const keepAnimation = !!props.keepAnimation;

  const isAnimatableFile = (file) => {
    if (!file) return false;
    const t = (file.type || "").toLowerCase();
    return t === "image/gif" || t === "image/webp";
  };

  const handleOpenUpload = () => {
    let shouldOpen = true;
    if (props.onClick) {
      shouldOpen = props.onClick();
    }
    if (shouldOpen) {
      setUploadDialogOpen(true);
    }
  };

  const handleCloseUpload = () => {
    setUploadDialogOpen(false);
  };

  const handleCloseCrop = () => {
    setCropDialogOpen(false);
    setSelectedFile(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setUploadDialogOpen(false);
      setCropDialogOpen(true);
    }
    // allow re-selecting the same file later
    e.target.value = "";
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches[0]) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const submitCroppedStill = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;

    // Use the preview box's actual rendered size (may be < 600×200 on phones)
    const rect = previewRef.current?.getBoundingClientRect();
    const viewportW =
      rect && rect.width > 0 ? rect.width : previewSize.w || PREVIEW_W;
    const viewportH =
      rect && rect.height > 0 ? rect.height : previewSize.h || PREVIEW_H;

    // Display width is viewportW * zoom; map viewport pixels to source pixels
    const displayWidth = viewportW * zoom;
    const pixelsPerDisplayPx = img.naturalWidth / displayWidth;

    const centerX = img.naturalWidth / 2 - position.x * pixelsPerDisplayPx;
    const centerY = img.naturalHeight / 2 - position.y * pixelsPerDisplayPx;

    const cropW = viewportW * pixelsPerDisplayPx;
    const cropH = viewportH * pixelsPerDisplayPx;

    const sx = centerX - cropW / 2;
    const sy = centerY - cropH / 2;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, OUTPUT_W, OUTPUT_H);
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, OUTPUT_W, OUTPUT_H);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const base =
            (selectedFile?.name || "banner").replace(/\.[^.]+$/, "") || "banner";
          const file = new File([blob], `${base}-cropped.png`, {
            type: "image/png",
          });
          props.onFileUpload([file], props.name || "banner");
          handleCloseCrop();
        }
      },
      "image/png",
      0.95
    );
  };

  const submitOriginalAnimated = () => {
    if (!selectedFile) return;
    props.onFileUpload([selectedFile], props.name || "banner");
    handleCloseCrop();
  };

  useEffect(() => {
    if (imageUrl && cropDialogOpen) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setPosition({ x: 0, y: 0 });
        // Fit image so the shorter side covers the crop frame (use live viewport size)
        const vw = previewSize.w || PREVIEW_W;
        const vh = previewSize.h || PREVIEW_H;
        const displayHAt1 = (img.naturalHeight / img.naturalWidth) * vw;
        let z = 1;
        if (displayHAt1 < vh) {
          z = vh / displayHAt1;
        }
        setZoom(Math.max(0.5, Math.min(3, z)));
      };
      img.src = imageUrl;
    }
    // Intentionally not depending on previewSize: ResizeObserver only drives export math;
    // re-fitting on every resize would reset the user's pan/zoom.
  }, [imageUrl, cropDialogOpen]);

  // Track the preview box's real rendered size so crop export matches what the user sees
  useEffect(() => {
    if (!cropDialogOpen) return;
    const el = previewRef.current;
    if (!el) return;

    const updateSize = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setPreviewSize((prev) => {
          if (
            Math.abs(prev.w - r.width) < 0.5 &&
            Math.abs(prev.h - r.height) < 0.5
          ) {
            return prev;
          }
          return { w: r.width, h: r.height };
        });
      }
    };

    updateSize();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateSize) : null;
    if (ro) ro.observe(el);
    window.addEventListener("resize", updateSize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [cropDialogOpen]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const showKeepAnimation =
    keepAnimation && selectedFile && isAnimatableFile(selectedFile);

  return (
    <>
      <div className={props.className} onClick={handleOpenUpload}>
        {props.children}
      </div>

      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUpload}
        maxWidth="sm"
        fullWidth
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            flexWrap: "wrap",
          }}
        >
          <img
            src={photographer}
            alt="photographer"
            width="60"
            height="60"
            style={{ flexShrink: 0 }}
          />
          <DialogTitle
            sx={{
              p: 0,
              flex: 1,
              fontSize: "1.25rem",
              lineHeight: 1.3,
              fontWeight: 600,
            }}
          >
            Upload Banner
          </DialogTitle>
        </Box>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Choose an image, then pan and zoom to frame your 3:1 banner.
              {keepAnimation
                ? " GIF/WebP can keep animation if you skip crop."
                : " GIF/WebP will be cropped as a still frame."}
            </Typography>
            <Button variant="contained" onClick={handleBrowseClick}>
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cropDialogOpen}
        onClose={handleCloseCrop}
        maxWidth="md"
        fullWidth
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            flexWrap: "wrap",
          }}
        >
          <img
            src={photographer}
            alt="photographer"
            width="60"
            height="60"
            style={{ flexShrink: 0 }}
          />
          <DialogTitle
            sx={{
              p: 0,
              flex: 1,
              fontSize: "1.25rem",
              lineHeight: 1.3,
              fontWeight: 600,
            }}
          >
            Adjust Banner
          </DialogTitle>
        </Box>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
            <Box
              ref={previewRef}
              sx={{
                width: "100%",
                maxWidth: PREVIEW_W,
                // Height follows 3:1 aspect from actual width (not fixed 200px)
                aspectRatio: "3 / 1",
                margin: "0 auto",
                position: "relative",
                overflow: "hidden",
                border: "2px solid",
                borderColor: "divider",
                borderRadius: 1,
                cursor: isDragging ? "grabbing" : "grab",
                backgroundColor: "background.paper",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    transform: "translate(-50%, -50%)",
                    maxWidth: "none",
                    // Match viewport so pan/zoom map 1:1 to export math
                    width: `${(previewSize.w || PREVIEW_W) * zoom}px`,
                    height: "auto",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                  draggable={false}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 1 }}>
              <IconButton
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                size="small"
              >
                -
              </IconButton>
              <Slider
                value={zoom}
                onChange={(e, value) => setZoom(value)}
                min={0.5}
                max={3}
                step={0.1}
                sx={{ flex: 1 }}
              />
              <IconButton
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                size="small"
              >
                +
              </IconButton>
            </Box>

            {showKeepAnimation && (
              <Typography variant="caption" color="text.secondary">
                Cropping exports a still frame. Use &quot;Keep animation&quot; to
                upload the original GIF/WebP without cropping.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button onClick={handleCloseCrop}>Cancel</Button>
          {showKeepAnimation && (
            <Button onClick={submitOriginalAnimated} variant="outlined">
              Keep animation (no crop)
            </Button>
          )}
          <Button onClick={submitCroppedStill} variant="contained">
            Apply crop
          </Button>
        </DialogActions>
      </Dialog>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
}
