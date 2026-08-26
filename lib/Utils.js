const fs = require("fs");
const sharp = require("sharp");

function unlinkIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    /* ignore */
  }
}

function removeAvatarVariantFiles(uploadPath, prefix) {
  for (const ext of ["webp", "gif", "png", "jpg", "jpeg"]) {
    unlinkIfExists(`${uploadPath}/${prefix}.${ext}`);
  }
  unlinkIfExists(`${uploadPath}/${prefix}_static.webp`);
}

async function writeStaticAvatarFrame(buffer, destPath) {
  const tmp = `${destPath}.tmp`;
  try {
    await sharp(buffer, { animated: false, pages: 1, limitInputPixels: false })
      .webp({ quality: 100 })
      .resize(100, 100, {
        kernel: sharp.kernel.lanczos3,
        fit: "cover",
        position: "center",
      })
      .toFile(tmp);
    fs.renameSync(tmp, destPath);
  } catch (e) {
    unlinkIfExists(tmp);
    throw e;
  }
}

function getCustomEmoteFilepath(userId, id, extension) {
  return `${process.env.UPLOAD_PATH}/${userId}_customEmote_${id}.${extension}`;
}

function getCustomStickerFilepath(userId, id, extension) {
  return `${process.env.UPLOAD_PATH}/${userId}_customSticker_${id}.${extension}`;
}

function remapCustomEmotes(user, userId) {
  user.settings.customEmotes = {};
  user.customEmotes.forEach((customEmote) => {
    user.settings.customEmotes[`:${customEmote.name}:`] = {
      userId: userId,
      id: customEmote.id,
      extension: customEmote.extension,
      name: customEmote.name,
      path: getCustomEmoteFilepath(
        userId,
        customEmote.id,
        customEmote.extension
      ),
    };
  });
}

function remapCustomStickers(user, userId) {
  user.settings.customStickers = {};
  (user.customStickers || []).forEach((customSticker) => {
    user.settings.customStickers[`:${customSticker.name}:`] = {
      userId: userId,
      id: customSticker.id,
      extension: customSticker.extension,
      name: customSticker.name,
      path: getCustomStickerFilepath(
        userId,
        customSticker.id,
        customSticker.extension
      ),
    };
  });
}

module.exports = {
  getCustomEmoteFilepath,
  getCustomStickerFilepath,
  remapCustomEmotes,
  remapCustomStickers,
  unlinkIfExists,
  removeAvatarVariantFiles,
  writeStaticAvatarFrame,
};
