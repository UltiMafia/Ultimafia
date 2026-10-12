import { resolveDisplayNameColor } from "../../utils/accessibleNameColors";

// Props for <NameWithAvatar> that render a game player the way the player
// list does (avatar or anonymous deck avatar, name color, animated name
// color, font). With `square`, players who own and enabled the square avatar
// shape get a square avatar.
export function playerNameWithAvatarProps(
  player,
  { user, theme, square } = {}
) {
  if (!player) return { name: "?" };
  const accessibleNameColors = user?.settings?.accessibleNameColors;
  return {
    id: player.userId,
    avatarId: player.anonId === undefined ? player.userId : player.anonId,
    name: player.name,
    avatar: player.avatar,
    isSquare: !!square && player.avatarShape === "square",
    color: resolveDisplayNameColor({
      accessibleNameColors,
      ignoreTextColor: user?.settings?.ignoreTextColor,
      rawNameColor: player.nameColor,
      autoContrastColor: user.autoContrastColor.bind(user),
      theme,
    }),
    nameColorSwatch:
      accessibleNameColors && player.nameColor ? player.nameColor : undefined,
    nameFont: player.nameFont,
    animatedNameColor: player.animatedNameColor,
    nameGradientColorA: player.nameGradientColorA,
    nameGradientColorB: player.nameGradientColorB,
    nameGradientColorC: player.nameGradientColorC,
  };
}
