const formidable = require("formidable");
const sharp = require("sharp");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 96 * 1024;
const MAX_OUTPUT_BYTES = 1024 * 1024;
const MAX_PIXELS = 16000000;
const FORMATS = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" };

function invalid(message, status = 422) {
  return Object.assign(new Error(message), { status });
}

// Buffer only this bounded form, never create a temporary public upload.
function parseForumReplyForm(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable();
    const fields = {};
    let image = null;
    let imageCount = 0;
    let fieldCount = 0;
    const fail = (error) => form._error(error);
    form.on("progress", (received, expected) => {
      if (received > MAX_BODY_BYTES || expected > MAX_BODY_BYTES)
        fail(invalid("Forum reply upload exceeds 5 MiB plus bounded form fields.", 413));
    });
    form.onPart = (part) => {
      if (form.error) return;
      const isFile = part.filename !== undefined;
      if (isFile) {
        imageCount += 1;
        if (part.name !== "image" || imageCount !== 1 || !FORMATS[part.mime]) {
          fail(invalid("Attach one PNG, JPEG or still WebP image."));
          return;
        }
      } else {
        fieldCount += 1;
        if (!["content", "thread"].includes(part.name) ||
            Object.prototype.hasOwnProperty.call(fields, part.name) ||
            fieldCount > 2) {
          fail(invalid("Invalid forum reply form fields."));
          return;
        }
        fields[part.name] = "";
      }
      let length = 0;
      const chunks = [];
      part.on("data", (chunk) => {
        if (form.error) return;
        length += chunk.length;
        if (length > (isFile ? MAX_IMAGE_BYTES : 81920)) {
          fail(invalid("Forum reply image or field is too large.", 413));
          return;
        }
        chunks.push(chunk);
      });
      part.on("end", () => {
        if (form.error) return;
        const data = Buffer.concat(chunks);
        if (isFile) image = { data, type: part.mime };
        else fields[part.name] = data.toString("utf8");
      });
    };
    form.parse(req, (error) => {
      if (error) {
        req.resume();
        reject(error.status ? error : invalid("Invalid forum reply upload.", 400));
      } else if (!image || !image.data.length ||
                 typeof fields.content !== "string" ||
                 typeof fields.thread !== "string") {
        reject(invalid("Forum reply text, thread and one image are required."));
      } else {
        resolve({ fields, image });
      }
    });
  });
}

function isAnimatedPng(data) {
  if (data.length < 8 || data.toString("hex", 0, 8) !== "89504e470d0a1a0a")
    return false;
  for (let offset = 8; offset + 12 <= data.length;) {
    const length = data.readUInt32BE(offset);
    if (data.toString("ascii", offset + 4, offset + 8) === "acTL") return true;
    offset += length + 12;
  }
  return false;
}

async function normalizeForumReplyImage(image) {
  if (!image || !FORMATS[image.type] || !Buffer.isBuffer(image.data) ||
      !image.data.length || image.data.length > MAX_IMAGE_BYTES)
    throw invalid("Attach one PNG, JPEG or still WebP image.");
  try {
    const decoder = sharp(image.data, { limitInputPixels: MAX_PIXELS, animated: true });
    const metadata = await decoder.metadata();
    if (metadata.format !== FORMATS[image.type] || (metadata.pages || 1) !== 1 ||
        metadata.width > 8192 || metadata.height > 8192 || isAnimatedPng(image.data))
      throw invalid("Image type must match its contents; animations are not supported.");
    const result = await decoder.rotate().resize({
      width: 1024, height: 1024, fit: "inside", withoutEnlargement: true,
    }).webp({ quality: 85 }).toBuffer();
    if (result.length > MAX_OUTPUT_BYTES)
      throw invalid("The processed image exceeds 1 MiB.", 413);
    return result;
  } catch (error) {
    if (error.status) throw error;
    throw invalid("Image could not be decoded, or exceeds 16 million pixels.");
  }
}

function appendForumReplyImage(content, id) {
  const markdown = `![Pasted image](/api/forums/reply/${id}/image)`;
  return content ? `${content}\n\n${markdown}` : markdown;
}

module.exports = {
  MAX_IMAGE_BYTES, MAX_BODY_BYTES, MAX_OUTPUT_BYTES, MAX_PIXELS,
  parseForumReplyForm, normalizeForumReplyImage, appendForumReplyImage,
};