import React from "react";

import "../css/emotes.css";

export function Emote(props) {
  const emoteKey = props.emote.toLowerCase();
  const emote = Emotes[emoteKey];

  return (
    <div
      className="emote"
      title={emote.name}
      style={{
        backgroundImage: `url('/images/emotes/${emote.name.toLowerCase()}.${
          emote.type
        }')`,
      }}
    />
  );
}

export function emotify(text) {
  if (text == null) return;

  if (!Array.isArray(text)) text = [text];

  for (let i in text) {
    let segment = text[i];

    if (typeof segment != "string") continue;

    const words = segment.split(" ");

    for (let j in words) {
      let word = words[j].toLowerCase();

      // Checking if Emote dictionary contains the word.
      if (Emotes[word] && typeof Emotes[word] != "function") {
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
  "-_-": {
    name: "expressionless",
    type: "webp",
  },
  "-@": {
    name: "jack",
    type: "webp",
  },
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
  ":@": {
    name: "cthulhu",
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
  ":awoo:": {
    name: "awoo",
    type: "webp",
  },
  ":bats:": {
    name: "bats",
    type: "webp",
  },
  ":birb:": {
    name: "birb",
    type: "gif",
  },
  ":boar:": {
    name: "boar",
    type: "webp",
  },
  ":bob:": {
    name: "bob",
    type: "gif",
  },
  ":bub:": {
    name: "bub",
    type: "gif",
  },
  ":bum:": {
    name: "bum",
    type: "gif",
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
  ":candycane:": {
    name: "candycane",
    type: "webp",
  },
  ":cat:": {
    name: "cat",
    type: "webp",
  },
  ":catjam:": {
    name: "catjam",
    type: "gif",
  },
  ":cavebob:": {
    name: "cavebob",
    type: "webp",
  },
  ":chick:": {
    name: "chick",
    type: "webp",
  },
  ":christmas:": {
    name: "christmas",
    type: "webp",
  },
  ":clock:": {
    name: "clock",
    type: "webp",
  },
  ":cookie:": {
    name: "cookie",
    type: "webp",
  },
  ":couldyounot:": {
    name: "couldyounot",
    type: "gif",
  },
  ":cupcake:": {
    name: "cupcake",
    type: "webp",
  },
  ":ditto:": {
    name: "ditto",
    type: "gif",
  },
  ":doge:": {
    name: "doge",
    type: "webp",
  },
  ":eee:": {
    name: "eee",
    type: "webp",
  },
  ":ez:": {
    name: "EZ",
    type: "webp",
  },
  ":feelsdankman:": {
    name: "FeelsDankMan",
    type: "webp",
  },
  ":feelsokayman:": {
    name: "FeelsOkayMan",
    type: "webp",
  },
  ":fox:": {
    name: "fox",
    type: "webp",
  },
  ":fufu:": {
    name: "fufu",
    type: "webp",
  },
  ":fufunb:": {
    name: "fufunb",
    type: "jpg",
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
  ":gay:": {
    name: "gay",
    type: "webp",
  },
  ":ghost:": {
    name: "ghost",
    type: "webp",
  },
  ":golb:": {
    name: "golb",
    type: "webp",
  },
  ":guessilldie:": {
    name: "guessilldie",
    type: "webp",
  },
  ":hammer:": {
    name: "hammer",
    type: "webp",
  },
  ":hamster:": {
    name: "hamster",
    type: "gif",
  },
  ":horse:": {
    name: "horse",
    type: "webp",
  },
  ":huh:": {
    name: "huh",
    type: "webp",
  },
  ":kapp:": {
    name: "Kapp",
    type: "webp",
  },
  ":kekm:": {
    name: "kekm",
    type: "webp",
  },
  ":knife:": {
    name: "knife",
    type: "webp",
  },
  ":lion:": {
    name: "lion",
    type: "webp",
  },
  ":lmao:": {
    name: "lmao",
    type: "webp",
  },
  ":mermaid:": {
    name: "mermaid",
    type: "webp",
  },
  ":monkagun:": {
    name: "MonkaGun",
    type: "webp",
  },
  ":monkahmm:": {
    name: "MonkaHmm",
    type: "webp",
  },
  ":monkas:": {
    name: "MonkaS",
    type: "webp",
  },
  ":monkfade:": {
    name: "monkfade",
    type: "gif",
  },
  ":monkspin:": {
    name: "monkspin",
    type: "gif",
  },
  ":nodders:": {
    name: "Nodders",
    type: "gif",
  },
  ":nopers:": {
    name: "Nopers",
    type: "gif",
  },
  ":o": {
    name: "surprised",
    type: "webp",
  },
  ":omegalul:": {
    name: "Omegalul",
    type: "webp",
  },
  ":omg:": {
    name: "omg",
    type: "webp",
  },
  ":p": {
    name: "tongue",
    type: "webp",
  },
  ":panda:": {
    name: "panda",
    type: "webp",
  },
  ":peepohappy:": {
    name: "PeepoHappy",
    type: "webp",
  },
  ":peeposad:": {
    name: "PeepoSad",
    type: "webp",
  },
  ":peepowtf:": {
    name: "PeepoWtf",
    type: "webp",
  },
  ":penguin:": {
    name: "penguin",
    type: "webp",
  },
  ":pepeawooga:": {
    name: "awooga128",
    type: "webp",
  },
  ":pepega:": {
    name: "Pepega",
    type: "webp",
  },
  ":pepegaaim:": {
    name: "PepegaAim",
    type: "gif",
  },
  ":pepehands:": {
    name: "PepeHands",
    type: "webp",
  },
  ":pepelaugh:": {
    name: "PepeLaugh",
    type: "webp",
  },
  ":pepemeltdown:": {
    name: "PepeMeltdown",
    type: "gif",
  },
  ":pepepains:": {
    name: "PepePains",
    type: "webp",
  },
  ":pepepls:": {
    name: "PepePls",
    type: "gif",
  },
  ":pepereee:": {
    name: "reeeee1",
    type: "webp",
  },
  ":pepog:": {
    name: "PepoG",
    type: "webp",
  },
  ":pingu:": {
    name: "pingu",
    type: "gif",
  },
  ":pizza:": {
    name: "pizza",
    type: "webp",
  },
  ":quiggle:": {
    name: "quiggle",
    type: "webp",
  },
  ":rainbow:": {
    name: "rainbow",
    type: "webp",
  },
  ":rainbowdoge:": {
    name: "rainbowdoge",
    type: "webp",
  },
  ":ratjam:": {
    name: "ratjam",
    type: "gif",
  },
  ":rawr:": {
    name: "rawr",
    type: "webp",
  },
  ":rip:": {
    name: "rip",
    type: "webp",
  },
  ":roach:": {
    name: "roach",
    type: "gif",
  },
  ":rose:": {
    name: "rose",
    type: "webp",
  },
  ":sadge:": {
    name: "Sadge",
    type: "webp",
  },
  ":sandbox:": {
    name: "sandbox",
    type: "webp",
  },
  ":santa:": {
    name: "santa",
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
  ":sip:": {
    name: "sip",
    type: "webp",
  },
  ":snake:": {
    name: "snake",
    type: "webp",
  },
  ":snowman:": {
    name: "snowman",
    type: "webp",
  },
  ":star:": {
    name: "star",
    type: "webp",
  },
  ":swag:": {
    name: "swag",
    type: "gif",
  },
  ":system:": {
    name: "system",
    type: "png",
  },
  ":gun:": {
    name: "gun",
    type: "webp",
  },
  ":fabgun:": {
    name: "fabgun",
    type: "webp",
  },
  ":love:": {
    name: "love",
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
  ":look:": {
    name: "look",
    type: "webp",
  },
  ":track:": {
    name: "track",
    type: "webp",
  },
  ":saw:": {
    name: "saw",
    type: "webp",
  },
  ":beer:": {
    name: "beer",
    type: "webp",
  },
  ":armor:": {
    name: "armor",
    type: "webp",
  },
  ":blood:": {
    name: "blood",
    type: "webp",
  },
  ":bomb:": {
    name: "bomb",
    type: "webp",
  },
  ":medalsilver:": {
    name: "medalsilver",
    type: "webp",
  },
  ":loud:": {
    name: "loud",
    type: "webp",
  },
  ":sy1f:": {
    name: "sy1f",
    type: "webp",
  },
  ":sy1g:": {
    name: "sy1g",
    type: "webp",
  },
  ":sy1h:": {
    name: "sy1h",
    type: "webp",
  },
  ":sy1i:": {
    name: "sy1i",
    type: "webp",
  },
  ":sy2a:": {
    name: "sy2a",
    type: "webp",
  },
  ":sy2b:": {
    name: "sy2b",
    type: "webp",
  },
  ":sy2c:": {
    name: "sy2c",
    type: "webp",
  },
  ":sy2d:": {
    name: "sy2d",
    type: "webp",
  },
  ":sy2e:": {
    name: "sy2e",
    type: "webp",
  },
  ":sy2f:": {
    name: "sy2f",
    type: "webp",
  },
  ":sy2g:": {
    name: "sy2g",
    type: "webp",
  },
  ":sy2h:": {
    name: "sy2h",
    type: "webp",
  },
  ":sy2i:": {
    name: "sy2i",
    type: "webp",
  },
  ":sy3a:": {
    name: "sy3a",
    type: "webp",
  },
  ":sy3b:": {
    name: "sy3b",
    type: "webp",
  },
  ":sy3c:": {
    name: "sy3c",
    type: "webp",
  },
  ":sy3d:": {
    name: "sy3d",
    type: "webp",
  },
  ":sy3e:": {
    name: "sy3e",
    type: "webp",
  },
  ":sy3f:": {
    name: "sy3f",
    type: "webp",
  },
  ":sy3g:": {
    name: "sy3g",
    type: "webp",
  },
  ":sy3h:": {
    name: "sy3h",
    type: "webp",
  },
  ":sy3i:": {
    name: "sy3i",
    type: "webp",
  },
  ":sy4a:": {
    name: "sy4a",
    type: "webp",
  },
  ":sy4b:": {
    name: "sy4b",
    type: "webp",
  },
  ":sy4c:": {
    name: "sy4c",
    type: "webp",
  },
  ":sy4d:": {
    name: "sy4d",
    type: "webp",
  },
  ":sy4e:": {
    name: "sy4e",
    type: "webp",
  },
  ":sy4f:": {
    name: "sy4f",
    type: "webp",
  },
  ":sy4g:": {
    name: "sy4g",
    type: "webp",
  },
  ":sy4h:": {
    name: "sy4h",
    type: "webp",
  },
  ":sy4i:": {
    name: "sy4i",
    type: "webp",
  },
  ":sy5a:": {
    name: "sy5a",
    type: "webp",
  },
  ":sy5b:": {
    name: "sy5b",
    type: "webp",
  },
  ":sy5c:": {
    name: "sy5c",
    type: "webp",
  },
  ":sy5d:": {
    name: "sy5d",
    type: "webp",
  },
  ":sy5e:": {
    name: "sy5e",
    type: "webp",
  },
  ":sy5f:": {
    name: "sy5f",
    type: "webp",
  },
  ":sy5g:": {
    name: "sy5g",
    type: "webp",
  },
  ":sy5h:": {
    name: "sy5h",
    type: "webp",
  },
  ":sy5i:": {
    name: "sy5i",
    type: "webp",
  },
  ":sy6a:": {
    name: "sy6a",
    type: "webp",
  },
  ":sy6b:": {
    name: "sy6b",
    type: "webp",
  },
  ":sy6c:": {
    name: "sy6c",
    type: "webp",
  },
  ":sy6d:": {
    name: "sy6d",
    type: "webp",
  },
  ":sy6e:": {
    name: "sy6e",
    type: "webp",
  },
  ":sy6f:": {
    name: "sy6f",
    type: "webp",
  },
  ":sy6g:": {
    name: "sy6g",
    type: "webp",
  },
  ":sy6h:": {
    name: "sy6h",
    type: "webp",
  },
  ":sy6i:": {
    name: "sy6i",
    type: "webp",
  },
  ":sy7a:": {
    name: "sy7a",
    type: "webp",
  },
  ":sy7b:": {
    name: "sy7b",
    type: "webp",
  },
  ":sy7c:": {
    name: "sy7c",
    type: "webp",
  },
  ":sy7d:": {
    name: "sy7d",
    type: "webp",
  },
  ":sy7e:": {
    name: "sy7e",
    type: "webp",
  },
  ":sy7f:": {
    name: "sy7f",
    type: "webp",
  },
  ":sy7g:": {
    name: "sy7g",
    type: "webp",
  },
  ":sy7h:": {
    name: "sy7h",
    type: "webp",
  },
  ":sy7i:": {
    name: "sy7i",
    type: "webp",
  },
  ":sy8a:": {
    name: "sy8a",
    type: "webp",
  },
  ":sy8b:": {
    name: "sy8b",
    type: "webp",
  },
  ":sy8c:": {
    name: "sy8c",
    type: "webp",
  },
  ":sy8d:": {
    name: "sy8d",
    type: "webp",
  },
  ":sy8e:": {
    name: "sy8e",
    type: "webp",
  },
  ":sy8f:": {
    name: "sy8f",
    type: "webp",
  },
  ":sy8g:": {
    name: "sy8g",
    type: "webp",
  },
  ":sy8h:": {
    name: "sy8h",
    type: "webp",
  },
  ":sy8i:": {
    name: "sy8i",
    type: "webp",
  },
  ":sy9a:": {
    name: "sy9a",
    type: "webp",
  },
  ":sy9b:": {
    name: "sy9b",
    type: "webp",
  },
  ":sy9c:": {
    name: "sy9c",
    type: "webp",
  },
  ":sy9d:": {
    name: "sy9d",
    type: "webp",
  },
  ":sy9e:": {
    name: "sy9e",
    type: "webp",
  },
  ":taco:": {
    name: "taco",
    type: "gif",
  },
  ":thomas:": {
    name: "thomasoface",
    type: "webp",
  },
  ":thonk:": {
    name: "thonk",
    type: "webp",
  },
  ":thunk:": {
    name: "thunk",
    type: "webp",
  },
  ":tiger:": {
    name: "tiger",
    type: "webp",
  },
  ":tip:": {
    name: "tip",
    type: "gif",
  },
  ":tipb:": {
    name: "tipb",
    type: "gif",
  },
  ":tmnt:": {
    name: "tmnt",
    type: "gif",
  },
  ":turkey:": {
    name: "turkey",
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
  ":wink:": {
    name: "wink",
    type: "webp",
  },
  ":wolf:": {
    name: "wolf",
    type: "webp",
  },
  ":yum:": {
    name: "yum",
    type: "gif",
  },
  ":zzz:": {
    name: "zzz",
    type: "webp",
  },
  "<3": {
    name: "heart",
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
};

export const EmoteKeys = Object.keys(Emotes);
