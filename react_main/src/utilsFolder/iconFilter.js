import { keyframes } from "@emotion/react";

const ICON_FILTER_CLASS_LIST_NO_FAS =
  '.role, .collapsIconWrapper, .expandIconWrapper, .game-icon, .gamesetting, .closed-role-count, .game-state-icon, .um-coin, img[alt=Kudos], img[alt=Karma], img[alt=Achievements], img[alt=Achievements], img[alt="Daily Challenges"], img[alt=Fortune], img[alt=Misfortune], .avatar, .banner, img, .video-responsive-content';
const ICON_FILTER_CLASS_LIST_ALL = `${ICON_FILTER_CLASS_LIST_NO_FAS}, .fas`;

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
      const r = "2px";
      const swirl1 = keyframes`
        0% {
          transform: rotate(0deg) translateX(3px) rotate(0deg);
        }
        30% {
          transform: rotate(180deg) translateX(3px) rotate(-180deg);
        }
        70% {
          transform: rotate(60deg) translateX(3px) rotate(-60deg);
        }
        100% {
          transform: rotate(360deg) translateX(3px) rotate(-360deg);
        }
      `;
      const swirl2 = keyframes`
        0% {
          transform: rotate(360deg) translateX(2px) rotate(-360deg);
        }
        100% {
          transform: rotate(0deg) translateX(2px) rotate(0deg);
        }
      `;
      const swirl3 = keyframes`
        0% {
          transform: rotate(0deg) translateX(3px) rotate(0deg);
        }
        100% {
          transform: rotate(360deg) translateX(3px) rotate(-360deg);
        }
      `;

      return {
        [ICON_FILTER_CLASS_LIST_NO_FAS]: {
          position: "relative",
          opacity: "0.75",
          animation: `${swirl1} 5s linear infinite`,

          "&:before, &:after": {
            display: "block",
            content: "''",
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background: "inherit",
            opacity: "0.75",
          },

          "&:before": {
            filter: "hue-rotate(120deg) contrast(200%) saturate(400%)",
            transformOrigin: "top left",
            animation: `${swirl2} 2s linear infinite`,
            transform: "scale(1.1) translate(-20%, -30%)",
          },

          "&:after": {
            filter: "hue-rotate(240deg) contrast(200%) saturate(400%)",
            transformOrigin: "bottom right",
            animation: `${swirl3} 3s linear infinite`,
            transform: "scale(1.1) translate(20%, -50%) rotate(140deg)",
          },
        },
      };
    }
    case "green": {
      return {
        [ICON_FILTER_CLASS_LIST_ALL]: {
          filter: "sepia(1) contrast(200%) saturate(400%) hue-rotate(80deg)",
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
          filter:
            "drop-shadow(0px 0px .15em rgba(255, 0, 255, 0.7)) drop-shadow(0px 0px .2em rgba(0, 255, 255, 0.7))",
        },
        ".site-wrapper, #root": {
          position: "relative",
          zIndex: "0",
          textShadow:
            "0px 0px .1em rgba(255, 0, 255, 0.7), 0px 0px .2em rgba(0, 255, 255, 0.7)",
        },
        ".site-wrapper:before": {
          content: "''",
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          background:
            "repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
          zIndex: "99999",
        },
      };
    }
    default: {
      console.error(
        `Invalid icon filter ${iconFilter}, this should never happen`
      );
      return {};
    }
  }
}
