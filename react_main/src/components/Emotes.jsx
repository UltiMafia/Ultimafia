import React from "react";
import "css/emotes.css";

export function Emote(props) {
  const emoteKey = props.emote.toLowerCase();
  const emote = Emotes[emoteKey];

  return (
    <div
      className="emote"
      title={emote.name}
      style={{
        backgroundImage: `url('${require(`images/emotes/${emote.name.toLowerCase()}.${
          emote.type
        }`)}')`,
      }}
    />
  );
}

export function CustomEmote(props) {
  const emote = props.emote;

  return (
    <div
      className="emote"
      title={emote.name}
      style={{
        backgroundImage: `url('/${emote.path}')`,
      }}
    />
  );
}

export function emotify(text, customEmotes) {
  if (text == null) return;

  if (!Array.isArray(text)) text = [text];

  for (let i in text) {
    let segment = text[i];

    if (typeof segment != "string") continue;

    const words = segment.split(" ");

    for (let j in words) {
      let word = words[j].toLowerCase();

      // Checking if Emote dictionary contains the word. Custom emotes have precedence
      if (customEmotes && customEmotes[word]) {
        words[j] = <CustomEmote emote={customEmotes[word]} />;
      } else if (Emotes[word] && typeof Emotes[word] != "function") {
        words[j] = <Emote emote={word} />;
      } else {
        if (j < words.length - 1) {
          // do NOT append an extra ' ' space in the last word (which wasn't there in the first place)
          words[j] += " ";
        }
      }
    }

    text[i] = words;
  }

  text = text.flat();
  return text.length === 1 ? text[0] : text;
}

export const Emotes = {
  // emojis
  ";_;": {
    name: "cry",
    type: "webp",
  },
  ";)": {
    name: "wink",
    type: "webp",
  },
  ":(": {
    name: "sad",
    type: "webp",
  },
  ":)": {
    name: "happy",
    type: "webp",
  },
  ":o": {
    name: "surprised",
    type: "webp",
  },
  ":p": {
    name: "tongue",
    type: "webp",
  },
  "-_-": {
    name: "expressionless",
    type: "webp",
  },
  ":|": {
    name: "neutral",
    type: "webp",
  },
  ":3": {
    name: "candy",
    type: "webp",
  },
  ":wink:": {
    name: "wink",
    type: "webp",
  },
  ":zzz:": {
    name: "zzz",
    type: "webp",
  },
  ">:(": {
    name: "frown",
    type: "webp",
  },
  o_o: {
    name: "confused",
    type: "webp",
  },
  zzz: {
    name: "zzz",
    type: "webp",
  },
  // retro
  "<3": {
    name: "heart",
    type: "webp",
  },
  "-@": {
    name: "jack",
    type: "webp",
  },
  ":christmas:": {
    name: "christmas",
    type: "webp",
  },
  ":cookie:": {
    name: "cookie",
    type: "webp",
  },
  ":star:": {
    name: "star",
    type: "webp",
  },
  ":rose:": {
    name: "rose",
    type: "webp",
  },
  ":santa:": {
    name: "santa",
    type: "webp",
  },
  ":candycane:": {
    name: "candycane",
    type: "webp",
  },
  // common
  ":bats:": {
    name: "bats",
    type: "webp",
  },
  ":boar:": {
    name: "boar",
    type: "webp",
  },
  ":cat:": {
    name: "cat",
    type: "webp",
  },
  ":@": {
    name: "cthulhu",
    type: "webp",
  },
  ":bump:": {
    name: "bump",
    type: "webp",
  },
  ":bunny:": {
    name: "bunny",
    type: "webp",
  },
  ":cake:": {
    name: "cake",
    type: "webp",
  },
  ":cupcake:": {
    name: "cupcake",
    type: "webp",
  },
  ":doge:": {
    name: "doge",
    type: "webp",
  },
  ":rainbowdoge:": {
    name: "rainbowdoge",
    type: "webp",
  },
  ":rawr:": {
    name: "rawr",
    type: "webp",
  },
  // fufu
  ":angel:": {
    name: "angel",
    type: "png",
  },
  ":chefufu:": {
    name: "chefufu",
    type: "png",
  },
  ":chtfulfu:": {
    name: "chtfulfu",
    type: "png",
  },
  ":flufu:": {
    name: "flufu",
    type: "png",
  },
  ":fufool:": {
    name: "fufool",
    type: "png",
  },
  ":fufu:": {
    name: "fufu",
    type: "png",
  },
  ":fufunky:": {
    name: "fufunky",
    type: "png",
  },
  ":fufuzela:": {
    name: "fufuzela",
    type: "png",
  },
  ":glad:": {
    name: "glad",
    type: "png",
  },
  ":knifufu:": {
    name: "knifufu",
    type: "png",
  },
  ":leafufu:": {
    name: "leafufu",
    type: "png",
  },
  ":beefufu:": {
    name: "beefufu",
    type: "png",
  },
  ":satan:": {
    name: "satan",
    type: "png",
  },
  ":sleepy:": {
    name: "sleepy",
    type: "png",
  },
  ":waifufu:": {
    name: "waifufu",
    type: "png",
  },
  ":wat:": {
    name: "wat",
    type: "png",
  },
  ":winky:": {
    name: "winky",
    type: "png",
  },
  ":fufu:": {
    name: "fufu",
    type: "webp",
  },
  ":fufunb:": {
    name: "fufunb",
    type: "webp",
  },
  ":fufubi:": {
    name: "fufubi",
    type: "webp",
  },
  ":fufulesbian:": {
    name: "fufulesbian",
    type: "webp",
  },
  ":fufutrans:": {
    name: "fufutrans",
    type: "webp",
  },
  ":omg:": {
    name: "omg",
    type: "webp",
  },
  ":gay:": {
    name: "gay",
    type: "webp",
  },
  ":fox:": {
    name: "fox",
    type: "webp",
  },
  ":ghost:": {
    name: "ghost",
    type: "webp",
  },
  ":horse:": {
    name: "horse",
    type: "webp",
  },
  ":lion:": {
    name: "lion",
    type: "webp",
  },
  ":mermaid:": {
    name: "mermaid",
    type: "webp",
  },
  ":panda:": {
    name: "panda",
    type: "webp",
  },
  ":penguin:": {
    name: "penguin",
    type: "webp",
  },
  ":pizza:": {
    name: "pizza",
    type: "webp",
  },
  ":rainbow:": {
    name: "rainbow",
    type: "webp",
  },
  ":sandbox:": {
    name: "sandbox",
    type: "webp",
  },
  ":snowman:": {
    name: "snowman",
    type: "webp",
  },
  ":sheep:": {
    name: "sheep",
    type: "webp",
  },
  ":shotgun:": {
    name: "shotgun",
    type: "webp",
  },
  ":snake:": {
    name: "snake",
    type: "webp",
  },
  ":tiger:": {
    name: "tiger",
    type: "webp",
  },
  ":unicorn:": {
    name: "unicorn",
    type: "webp",
  },
  ":werewolf:": {
    name: "werewolf",
    type: "webp",
  },
  ":wolf:": {
    name: "wolf",
    type: "webp",
  },
  // system
  ":hammer:": {
    name: "hammer",
    type: "webp",
  },
  ":message:": {
    name: "message",
    type: "webp",
  },
  ":rip:": {
    name: "rip",
    type: "webp",
  },
  ":system:": {
    name: "system",
    type: "webp",
  },
  ":will:": {
    name: "will",
    type: "webp",
  },
  // items
  ":armor:": {
    name: "armor",
    type: "webp",
  },
  ":armor2:": {
    name: "armor2",
    type: "webp",
  },
  ":bread:": {
    name: "bread",
    type: "webp",
  },
  ":bread2:": {
    name: "bread2",
    type: "webp",
  },
  ":beer:": {
    name: "beer",
    type: "webp",
  },
  ":bomb:": {
    name: "bomb",
    type: "webp",
  },
  ":cat2:": {
    name: "cat2",
    type: "webp",
  },
  ":candle:": {
    name: "candle",
    type: "webp",
  },
  ":crystal:": {
    name: "crystal",
    type: "webp",
  },
  ":crystal2:": {
    name: "crystal2",
    type: "webp",
  },
  ":doll:": {
    name: "doll",
    type: "webp",
  },
  ":doll2:": {
    name: "doll2",
    type: "webp",
  },
  ":dynamite:": {
    name: "dynamite",
    type: "webp",
  },
  ":gun:": {
    name: "gun",
    type: "webp",
  },
  ":gun2:": {
    name: "gun2",
    type: "webp",
  },
  ":gun3:": {
    name: "gun3",
    type: "webp",
  },
  ":gun4:": {
    name: "gun4",
    type: "webp",
  },
  ":gunfab:": {
    name: "gunfab",
    type: "webp",
  },
  ":key:": {
    name: "key",
    type: "webp",
  },
  ":knife:": {
    name: "knife",
    type: "webp",
  },
  ":knife2:": {
    name: "knife2",
    type: "webp",
  },
  ":match:": {
    name: "match",
    type: "webp",
  },
  ":snowball:": {
    name: "snowball",
    type: "webp",
  },
  ":timebomb:": {
    name: "timebomb",
    type: "webp",
  },
  ":yuzu:": {
    name: "yuzu",
    type: "webp",
  },
  // investigative
  ":carol:": {
    name: "carol",
    type: "webp",
  },
  ":carol2:": {
    name: "carol2",
    type: "webp",
  },
  ":dream:": {
    name: "dream",
    type: "webp",
  },
  ":invest:": {
    name: "invest",
    type: "webp",
  },
  ":journ:": {
    name: "journ",
    type: "webp",
  },
  ":law:": {
    name: "law",
    type: "webp",
  },
  ":loud:": {
    name: "loud",
    type: "webp",
  },
  ":snoop:": {
    name: "snoop",
    type: "webp",
  },
  ":track:": {
    name: "track",
    type: "webp",
  },
  ":visited:": {
    name: "visited",
    type: "webp",
  },
  ":watch:": {
    name: "watch",
    type: "webp",
  },
  // effects
  ":love:": {
    name: "love",
    type: "webp",
  },
  ":love2:": {
    name: "love2",
    type: "webp",
  },
  ":hb:": {
    name: "heartbroken",
    type: "webp",
  },
  ":insane:": {
    name: "insane",
    type: "webp",
  },
  ":sane:": {
    name: "sane",
    type: "webp",
  },
  ":invincible:": {
    name: "invincible",
    type: "webp",
  },
  // death
  ":blood:": {
    name: "blood",
    type: "webp",
  },
  ":veg:": {
    name: "veg",
    type: "webp",
  },
  ":exit:": {
    name: "exit",
    type: "webp",
  },
  // win
  ":flagblue:": {
    name: "flagblue",
    type: "webp",
  },
  ":flagblack:": {
    name: "flagblack",
    type: "webp",
  },
  ":flagyellow:": {
    name: "flagyellow",
    type: "webp",
  },
  ":mistletoe:": {
    name: "mistletoe",
    type: "webp",
  },
  // miscellaneous
  ":anon:": {
    name: "anon",
    type: "webp",
  },
  ":bible:": {
    name: "bible",
    type: "webp",
  },
  ":dumbbell:": {
    name: "dumbbell",
    type: "webp",
  },
  ":handcuff:": {
    name: "handcuff",
    type: "webp",
  },
  ":mask:": {
    name: "mask",
    type: "webp",
  },
  ":mop:": {
    name: "mop",
    type: "webp",
  },
  ":paintbrush:": {
    name: "paintbrush",
    type: "webp",
  },
  ":poison:": {
    name: "poison",
    type: "webp",
  },
  ":suit:": {
    name: "suit",
    type: "webp",
  },
  ":tomb:": {
    name: "tomb",
    type: "webp",
  },
  ":tree:": {
    name: "tree",
    type: "webp",
  },
  ":trap:": {
    name: "trap",
    type: "webp",
  },
  ":turkey:": {
    name: "turkey",
    type: "webp",
  },
  // unused
  ":bee:": {
    name: "bee",
    type: "webp",
  },
  ":charger:": {
    name: "charger",
    type: "webp",
  },
  ":cloth:": {
    name: "cloth",
    type: "webp",
  },
  ":drill:": {
    name: "drill",
    type: "webp",
  },
  ":drill2:": {
    name: "drill2",
    type: "webp",
  },
  ":hat:": {
    name: "hat",
    type: "webp",
  },
  ":lobster:": {
    name: "lobster",
    type: "webp",
  },
  ":loot:": {
    name: "loot",
    type: "webp",
  },
  ":medalsilver:": {
    name: "medalsilver",
    type: "webp",
  },
  ":rose2:": {
    name: "rose2",
    type: "webp",
  },
  ":saw:": {
    name: "saw",
    type: "webp",
  },
  ":scream:": {
    name: "scream",
    type: "webp",
  },
  ":shirt:": {
    name: "shirt",
    type: "webp",
  },
  ":shirt2:": {
    name: "shirt2",
    type: "webp",
  },
  ":violin:": {
    name: "violin",
    type: "webp",
  },
  //dice
  ":dice1:": {
    name: "dice1",
    type: "webp",
  },
  ":dice2:": {
    name: "dice2",
    type: "webp",
  },
  ":dice3:": {
    name: "dice3",
    type: "webp",
  },
  ":dice4:": {
    name: "dice4",
    type: "webp",
  },
  ":dice5:": {
    name: "dice5",
    type: "webp",
  },
  ":dice6:": {
    name: "dice6",
    type: "webp",
  },
  ":lore:": {
    name: "lore",
    type: "webp",
  },
};

export const EmoteKeys = Object.keys(Emotes);
