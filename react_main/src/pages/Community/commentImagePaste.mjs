// Keep clipboard selection independent of react-mde's filtered-item indexes.
export const MAX_COMMENT_IMAGE_BYTES = 5 * 1024 * 1024;
export const COMMENT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function pastedCommentImage(items) {
  const images = Array.from(items || []).filter(
    (item) => item.kind === "file" && item.type.startsWith("image/")
  );
  if (!images.length) return null;
  if (images.length !== 1) throw new Error("Paste one image at a time.");
  const file = images[0].getAsFile();
  if (!file || !COMMENT_IMAGE_TYPES.includes(file.type))
    throw new Error("Paste a PNG, JPEG or non-animated WebP image.");
  if (!file.size || file.size > MAX_COMMENT_IMAGE_BYTES)
    throw new Error("Images must be between 1 byte and 5 MiB.");
  return file;
}
