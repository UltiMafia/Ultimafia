export const AVATAR_CROP_OUTPUT_SIZE = 300;

// The preview covers its frame at zoom 1. Frame size may change independently
// of the output resolution; pan offsets are measured in preview CSS pixels.
export function avatarCropSource({ naturalWidth, naturalHeight, previewSize, zoom, position }) {
  if (![naturalWidth, naturalHeight, previewSize, zoom].every(value => Number.isFinite(value) && value > 0)) return null;
  const imageRatio = naturalWidth / naturalHeight;
  const pixelsPerDisplayPixel = naturalWidth / (previewSize * Math.max(1, imageRatio) * zoom);
  const size = previewSize * pixelsPerDisplayPixel;
  return {
    x: naturalWidth / 2 - position.x * pixelsPerDisplayPixel - size / 2,
    y: naturalHeight / 2 - position.y * pixelsPerDisplayPixel - size / 2,
    size,
  };
}
