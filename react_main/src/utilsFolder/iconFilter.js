const ICON_FILTER_CLASS_LIST =
  '.role, .collapsIconWrapper, .expandIconWrapper, .game-icon, .gamesetting, .closed-role-count, .game-state-icon, .um-coin, img[alt=Kudos], img[alt=Karma], img[alt=Achievements], img[alt=Achievements], img[alt="Daily Challenges"], img[alt=Fortune], img[alt=Misfortune]';
const ICON_FILTER_CLASS_LIST_ALL = `${ICON_FILTER_CLASS_LIST}, .fas, .avatar, .banner, img, .video-responsive-content`;

export function getIconFilter(iconFilter) {
  switch (iconFilter) {
    case "none": {
      return {};
    }
    case "highContrast": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: { filter: "contrast(200%)" },
      };
    }
    case "sepia": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: { filter: "sepia(60%)" },
      };
    }
    case "inverted": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: { filter: "invert(100%)" },
      };
    }
    case "grayscale": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: { filter: "grayscale(100%)" },
      };
    }
    case "colorful": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: { filter: "saturate(200%)" },
      };
    }
    case "elevated": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: {
          filter: "drop-shadow(.04rem .04rem 0 #000)",
        },
      };
    }
    case "upsideDown": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: { transform: "scaleY(-1)" },
      };
    }
    case "hallucination": {
      return {
        [ICON_FILTER_CLASS_LIST]: {
          position: "relative",

          "&:before, &:after": {
            display: "block",
            content: "''",
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background: "inherit",
            backgroundBlendMode: "multiply",
            transform: "scale(1.1)",
          },

          "&:before": {
            filter: "hue-rotate(120deg)",
            transformOrigin: "top left",
          },

          "&:after": {
            filter: "hue-rotate(240deg)",
            transformOrigin: "bottom right",
          },
        },
      };
    }
    case "green": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: {
          filter:
            "sepia(1) contrast(200%) saturate(400%) hue-rotate(80deg)",
        },
      };
    }
    case "chromaticAberration": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: {
          filter:
            "drop-shadow(3px 0px 0px rgba(255, 0, 0, 0.7)) drop-shadow(-3px 0px 0px rgba(0, 255, 0, 0.7)) drop-shadow(0px 3px 0px rgba(0, 0, 255, 0.7))",
        },
      };
    }
    case "vaporwave": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: {
          filter: "drop-shadow(0px 0px .15em rgba(255, 0, 255, 0.7)) drop-shadow(0px 0px .2em rgba(0, 255, 255, 0.7))",
        },
        ".site-wrapper, #root": {
          position: "relative",
          zIndex: "0",
          textShadow: "0px 0px .1em rgba(255, 0, 255, 0.7), 0px 0px .2em rgba(0, 255, 255, 0.7)"
        },
        ".site-wrapper:before": {
          content: "''",
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          background: "repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
          zIndex: "99999",
        },
      };
    }
    default: {
      console.error(`Invalid icon filter ${iconFilter}, this should never happen`);
      return {};
    }
  }
}