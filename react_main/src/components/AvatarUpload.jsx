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
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const previewSize = 300;

    // Output size is directly controlled by zoom: zoom * 100
    // zoom = 0.5 → 50px, zoom = 1.0 → 100px, zoom = 2.0 → 200px
    const outputSize = Math.round(previewSize * zoom);

    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate scale: how many source pixels per displayed pixel
    // The image is displayed at 300px width in the DOM
    const scale = imageRef.current.naturalWidth / 300;

    // Calculate the center of the crop in source image coordinates
    // position is in screen pixels, so we need to scale it to source pixels
    const centerX = imageRef.current.naturalWidth / 2 - position.x * scale;
    const centerY = imageRef.current.naturalHeight / 2 - position.y * scale;

    // The visible crop area in the preview is 300px (the circle size)
    // At zoom=1, we want this to correspond to 100px output
    // So we need to crop: 300 * scale / zoom source pixels
    const cropSizeInSourcePixels = (previewSize * scale) / zoom;

    // Calculate source crop coordinates
    const sx = centerX - cropSizeInSourcePixels / 2;
    const sy = centerY - cropSizeInSourcePixels / 2;

    ctx.drawImage(
      imageRef.current,
      sx,
      sy,
      cropSizeInSourcePixels,
      cropSizeInSourcePixels,
      0,
      0,
      outputSize,
      outputSize
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
                width: 300,
                height: 300,
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
                    width: "300px",
                    height: "auto",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                  draggable={false}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2 }}>
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
