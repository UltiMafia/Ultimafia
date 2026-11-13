import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
} from "@mui/material";
import { UiAction, UiDialog, UiIcon, UiSlider } from "./ui";
import { avatarCropSource, AVATAR_CROP_OUTPUT_SIZE } from "../utils/avatarCropGeometry.mjs";

export default function AvatarUpload(props) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropElement, setCropElement] = useState(null);
  const [previewSize, setPreviewSize] = useState(300);
  const [imageRatio, setImageRatio] = useState(1);
  const [cropPending, setCropPending] = useState(false);
  const cropOperation = useRef(0);
  const cropSubmitting = useRef(false);
  const previousPreviewSize = useRef(300);

  const fileInputRef = useRef();
  const canvasRef = useRef();
  const imageRef = useRef();

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
    cropOperation.current++;
    cropSubmitting.current = false;
    setCropPending(false);
    setCropDialogOpen(false);
    imageRef.current = null;
    setSelectedFile(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      cropOperation.current++;
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setUploadDialogOpen(false);
      setCropDialogOpen(true);
    }
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

  const handleSubmit = () => {
    if (!canvasRef.current || !imageRef.current || cropSubmitting.current) return;
    const img = imageRef.current;
    const source = avatarCropSource({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, previewSize: cropElement?.clientWidth || previewSize, zoom, position });
    const ctx = canvasRef.current.getContext("2d");
    if (!source || !ctx) return;
    cropSubmitting.current = true;
    setCropPending(true);
    const operation = cropOperation.current;

    const canvas = canvasRef.current;
    const outputSize = AVATAR_CROP_OUTPUT_SIZE;

    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.drawImage(
      img,
      source.x,
      source.y,
      source.size,
      source.size,
      0,
      0,
      outputSize,
      outputSize
    );

    canvas.toBlob((blob) => {
      if (operation !== cropOperation.current) return;
      if (blob) {
        const file = new File([blob], selectedFile.name, { type: "image/png" });
        props.onFileUpload([file], props.name);
        handleCloseCrop();
      } else { cropSubmitting.current = false; setCropPending(false); }
    }, "image/png");
  };

  const submitOriginalAnimated = () => {
    if (!selectedFile) return;
    props.onFileUpload([selectedFile], props.name || "avatar");
    handleCloseCrop();
  };

  const showKeepAnimation =
    keepAnimation && selectedFile && isAnimatableFile(selectedFile);

  useEffect(() => {
    if (imageUrl && cropDialogOpen) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageRatio(img.naturalWidth / img.naturalHeight || 1);
        // Reset position and zoom when new image loads
        setPosition({ x: 0, y: 0 });
        setZoom(1);
      };
      img.src = imageUrl;
      return () => { img.onload = null; };
    }
  }, [imageUrl, cropDialogOpen]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!cropElement) return;
    const measure = () => {
      const width = cropElement.clientWidth;
      if (!width || width === previousPreviewSize.current) return;
      const ratio = width / previousPreviewSize.current;
      previousPreviewSize.current = width;
      setPreviewSize(width);
      setPosition(previous => ({ x: previous.x * ratio, y: previous.y * ratio }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cropElement);
    return () => observer.disconnect();
  }, [cropElement]);

  return (
    <>
      <UiAction className={props.className} aria-label="Upload avatar" onClick={handleOpenUpload}>
        {props.children}
      </UiAction>

      <UiDialog title="Upload avatar"
        open={uploadDialogOpen}
        onClose={handleCloseUpload}
        maxWidth="sm"
        actions={<UiAction onClick={handleCloseUpload}>Cancel</UiAction>}
      >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Choose an image, then pan and zoom to frame your avatar.
              {keepAnimation
                ? " GIF/WebP can keep animation if you skip crop."
                : " GIF/WebP will be saved as a still frame."}
            </Typography>
            <UiAction variant="primary" onClick={handleBrowseClick}>
              Browse Files
            </UiAction>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </Box>
      </UiDialog>

      <UiDialog title="Crop avatar"
        open={cropDialogOpen}
        onClose={handleCloseCrop}
        maxWidth="sm"
        actions={<><UiAction onClick={handleCloseCrop}>Cancel</UiAction>{showKeepAnimation && <UiAction disabled={cropPending} onClick={submitOriginalAnimated}>Keep animation (no crop)</UiAction>}<UiAction variant="primary" busy={cropPending} disabled={!imageRef.current} onClick={handleSubmit}>Apply crop</UiAction></>}
      >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 2 }}>
            <Box
              ref={setCropElement} data-avatar-crop
              tabIndex={0} role="group" aria-label="Avatar crop preview"
              onKeyDown={event => {
                const offsets = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
                if (offsets[event.key]) { event.preventDefault(); const [x, y] = offsets[event.key]; setPosition(previous => ({ x: previous.x + x, y: previous.y + y })); }
              }}
              sx={{
                width: "100%",
                maxWidth: 300,
                aspectRatio: "1",
                flexShrink: 0,
                touchAction: "none",
                margin: "0 auto",
                position: "relative",
                overflow: "hidden",
                border: "2px solid",
                borderColor: "divider",
                borderRadius: props.isSquare ? undefined : "50%",
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
                    width: `${previewSize * Math.max(1, imageRatio) * zoom}px`,
                    height: "auto",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                  draggable={false}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2 }}>
              <UiAction iconOnly aria-label="Zoom out"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <UiIcon name="remove" />
              </UiAction>
              <UiSlider aria-label="Avatar zoom"
                value={zoom}
                onChange={(e, value) => setZoom(value)}
                min={0.5}
                max={3}
                step={0.1}
                sx={{ flex: 1 }}
              />
              <UiAction iconOnly aria-label="Zoom in"
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              >
                <UiIcon name="add" />
              </UiAction>
            </Box>
          </Box>
        {showKeepAnimation && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Cropping exports a still frame. Use &quot;Keep animation&quot; to
              upload the original GIF/WebP (resized to 100×100, animation
              preserved as WebP).
            </Typography>
          </Box>
        )}
      </UiDialog>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
}
