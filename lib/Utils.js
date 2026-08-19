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
};
