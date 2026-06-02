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

const PREVIEW_SIZE = 300;
const OUTPUT_SIZE = 256;

export default function AvatarUpload(props) {
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

  function getDisplayMetrics(img, zoomValue) {
    const baseScale = Math.max(
      PREVIEW_SIZE / img.naturalWidth,
      PREVIEW_SIZE / img.naturalHeight
    );
    const scaledWidth = img.naturalWidth * baseScale * zoomValue;
    const scaledHeight = img.naturalHeight * baseScale * zoomValue;
    return { baseScale, scaledWidth, scaledHeight };
  }

  function clampPosition(nextPosition, img, zoomValue) {
    if (!img) return nextPosition;
    const { scaledWidth, scaledHeight } = getDisplayMetrics(img, zoomValue);
    const maxOffsetX = Math.max(0, (scaledWidth - PREVIEW_SIZE) / 2);
    const maxOffsetY = Math.max(0, (scaledHeight - PREVIEW_SIZE) / 2);

    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nextPosition.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, nextPosition.y)),
    };
  }

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
      const nextPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setPosition(clampPosition(nextPosition, imageRef.current, zoom));
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
      e.preventDefault();
      const touch = e.touches[0];
      const nextPosition = {
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      };
      setPosition(clampPosition(nextPosition, imageRef.current, zoom));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSubmit = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const image = imageRef.current;
    const { baseScale } = getDisplayMetrics(image, zoom);
    const activeScale = baseScale * zoom;

    // Image top-left in preview coordinates after centering + drag
    const imageLeft = (PREVIEW_SIZE - image.naturalWidth * activeScale) / 2 + position.x;
    const imageTop = (PREVIEW_SIZE - image.naturalHeight * activeScale) / 2 + position.y;

    // Map preview square back into source image coordinates.
    const sx = (0 - imageLeft) / activeScale;
    const sy = (0 - imageTop) / activeScale;
    const cropSizeInSourcePixels = PREVIEW_SIZE / activeScale;

    ctx.drawImage(
      image,
      sx,
      sy,
      cropSizeInSourcePixels,
      cropSizeInSourcePixels,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], selectedFile.name, { type: "image/png" });
        props.onFileUpload([file], props.name);
        handleCloseCrop();
      }
    }, "image/png");
  };

  useEffect(() => {
    if (imageUrl && cropDialogOpen) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        // Reset position and zoom when new image loads
        setPosition({ x: 0, y: 0 });
        setZoom(1);
      };
      img.src = imageUrl;
    }
  }, [imageUrl, cropDialogOpen]);

  useEffect(() => {
    if (!imageRef.current) return;
    setPosition((prev) => clampPosition(prev, imageRef.current, zoom));
  }, [zoom]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

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
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            Upload Avatar
          </DialogTitle>
        </Box>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
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
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            Upload Avatar
          </DialogTitle>
        </Box>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 2 }}>
            <Box
              sx={{
                width: PREVIEW_SIZE,
                height: PREVIEW_SIZE,
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
                    top: "50%",
                    left: "50%",
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                    transformOrigin: "center",
                    maxWidth: "none",
                    width: "auto",
                    height: "auto",
                    minWidth: `${PREVIEW_SIZE}px`,
                    minHeight: `${PREVIEW_SIZE}px`,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                  draggable={false}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2 }}>
              <IconButton
                onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                size="small"
              >
                -
              </IconButton>
              <Slider
                value={zoom}
                onChange={(e, value) => setZoom(value)}
                min={1}
                max={3}
                step={0.1}
                sx={{ flex: 1 }}
              />
              <IconButton
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                size="small"
              >
                +
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrop}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
}
