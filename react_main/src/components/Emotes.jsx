import React, { useEffect } from "react";

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
      if (Emotes[word]) {
        words[j] = <Emote emote={word} />;
      } else {
        words[j] = words[j];
        if (j < words.length - 1) {
          // do NOT append an extra ' ' space in the last word (which wasn't there in the first place)
          words[j] += " ";
        }
      }
    }

    text[i] = words;
  }

  text = text.flat();
  return text.length == 1 ? text[0] : text;
}

export const Emotes = {
  "-_-": {
    name: "expressionless",
    type: "png",
  },
  "-@": {
    name: "jack",
    type: "png",
  },
  ";_;": {
    name: "cry",
    type: "png",
  },
  ";)": {
    name: "wink",
    type: "png",
  },
  ":(": {
    name: "sad",
    type: "png",
  },
  ":)": {
    name: "happy",
    type: "png",
  },
  ":@": {
    name: "cthulhu",
    type: "png",
  },
  ":|": {
    name: "neutral",
    type: "png",
  },
  ":3": {
    name: "candy",
    type: "png",
  },
  ":awoo:": {
    name: "awoo",
    type: "png",
  },
  ":bats:": {
    name: "bats",
    type: "png",
  },
  ":birb:": {
    name: "birb",
    type: "gif",
  },
  ":boar:": {
    name: "boar",
    type: "png",
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
    type: "png",
  },
  ":bunny:": {
    name: "bunny",
    type: "png",
  },
  ":cake:": {
    name: "cake",
    type: "png",
  },
  ":candycane:": {
    name: "candycane",
    type: "png",
  },
  ":cat:": {
    name: "cat",
    type: "png",
  },
  ":catjam:": {
    name: "catjam",
    type: "gif",
  },
  ":cavebob:": {
    name: "cavebob",
    type: "png",
  },
  ":chick:": {
    name: "chick",
    type: "png",
  },
  ":christmas:": {
    name: "christmas",
    type: "png",
  },
  ":clock:": {
    name: "clock",
    type: "png",
  },
  ":cookie:": {
    name: "cookie",
    type: "png",
  },
  ":couldyounot:": {
    name: "couldyounot",
    type: "gif",
  },
  ":cupcake:": {
    name: "cupcake",
    type: "png",
  },
  ":ditto:": {
    name: "ditto",
    type: "gif",
  },
  ":doge:": {
    name: "doge",
    type: "png",
  },
  ":eee:": {
    name: "eee",
    type: "png",
  },
  ":ez:": {
    name: "EZ",
    type: "png",
  },
  ":feelsdankman:": {
    name: "FeelsDankMan",
    type: "png",
  },
  ":feelsokayman:": {
    name: "FeelsOkayMan",
    type: "png",
  },
  ":fox:": {
    name: "fox",
    type: "png",
  },
  ":fufu:": {
    name: "fufu",
    type: "png",
  },
  ":fufunb:": {
    name: "fufunb",
    type: "jpg",
  },
  ":fufubi:": {
    name: "fufubi",
    type: "png",
  },
  ":fufulesbian:": {
    name: "fufulesbian",
    type: "png",
  },
  ":fufutrans:": {
    name: "fufutrans",
    type: "png",
  },
  ":gay:": {
    name: "gay",
    type: "png",
  },
  ":ghost:": {
    name: "ghost",
    type: "png",
  },
  ":hammer:": {
    name: "hammer",
    type: "png",
  },
  ":hamster:": {
    name: "hamster",
    type: "gif",
  },
  ":horse:": {
    name: "horse",
    type: "png",
  },
  ":kapp:": {
    name: "Kapp",
    type: "png",
  },
  ":kekm:": {
    name: "kekm",
    type: "png",
  },
  ":knife:": {
    name: "knife",
    type: "png",
  },
  ":lion:": {
    name: "lion",
    type: "png",
  },
  ":lmao:": {
    name: "lmao",
    type: "png",
  },
  ":mermaid:": {
    name: "mermaid",
    type: "png",
  },
  ":monkagun:": {
    name: "MonkaGun",
    type: "png",
  },
  ":monkahmm:": {
    name: "MonkaHmm",
    type: "png",
  },
  ":monkas:": {
    name: "MonkaS",
    type: "png",
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
    type: "png",
  },
  ":omegalul:": {
    name: "Omegalul",
    type: "png",
  },
  ":omg:": {
    name: "omg",
    type: "png",
  },
  ":p": {
    name: "tongue",
    type: "png",
  },
  ":panda:": {
    name: "panda",
    type: "png",
  },
  ":peepohappy:": {
    name: "PeepoHappy",
    type: "png",
  },
  ":peeposad:": {
    name: "PeepoSad",
    type: "png",
  },
  ":peepowtf:": {
    name: "PeepoWtf",
    type: "png",
  },
  ":penguin:": {
    name: "penguin",
    type: "png",
  },
  ":pepeawooga:": {
    name: "awooga128",
    type: "png",
  },
  ":pepega:": {
    name: "Pepega",
    type: "png",
  },
  ":pepegaaim:": {
    name: "PepegaAim",
    type: "gif",
  },
  ":pepehands:": {
    name: "PepeHands",
    type: "png",
  },
  ":pepelaugh:": {
    name: "PepeLaugh",
    type: "png",
  },
  ":pepemeltdown:": {
    name: "PepeMeltdown",
    type: "gif",
  },
  ":pepepains:": {
    name: "PepePains",
    type: "png",
  },
  ":pepepls:": {
    name: "PepePls",
    type: "gif",
  },
  ":pepereee:": {
    name: "reeeee1",
    type: "png",
  },
  ":pepog:": {
    name: "PepoG",
    type: "png",
  },
  ":pingu:": {
    name: "pingu",
    type: "gif",
  },
  ":pizza:": {
    name: "pizza",
    type: "png",
  },
  ":quiggle:": {
    name: "quiggle",
    type: "png",
  },
  ":rainbow:": {
    name: "rainbow",
    type: "png",
  },
  ":rainbowdoge:": {
    name: "rainbowdoge",
    type: "png",
  },
  ":ratjam:": {
    name: "ratjam",
    type: "gif",
  },
  ":rawr:": {
    name: "rawr",
    type: "png",
  },
  ":rip:": {
    name: "rip",
    type: "png",
  },
  ":roach:": {
    name: "roach",
    type: "gif",
  },
  ":rose:": {
    name: "rose",
    type: "png",
  },
  ":sadge:": {
    name: "Sadge",
    type: "png",
  },
  ":sandbox:": {
    name: "sandbox",
    type: "png",
  },
  ":santa:": {
    name: "santa",
    type: "png",
  },
  ":sheep:": {
    name: "sheep",
    type: "png",
  },
  ":shotgun:": {
    name: "shotgun",
    type: "png",
  },
  ":snake:": {
    name: "snake",
    type: "png",
  },
  ":snowman:": {
    name: "snowman",
    type: "png",
  },
  ":star:": {
    name: "star",
    type: "png",
  },
  ":swag:": {
    name: "swag",
    type: "gif",
  },
  ":gun:": {
    name: "gun",
    type: "png",
  },
  ":fabgun:": {
    name: "fabgun",
    type: "png",
  },
  ":love:": {
    name: "love",
    type: "png",
  },
  ":invest:": {
    name: "invest",
    type: "png",
  },
  ":journ:": {
    name: "journ",
    type: "png",
  },
  ":look:": {
    name: "look",
    type: "png",
  },
  ":track:": {
    name: "track",
    type: "png",
  },
  ":saw:": {
    name: "saw",
    type: "png",
  },
  ":beer:": {
    name: "beer",
    type: "png",
  },
  ":armor:": {
    name: "armor",
    type: "png",
  },
  ":blood:": {
    name: "blood",
    type: "png",
  },
  ":bomb:": {
    name: "bomb",
    type: "png",
  },
  ":medalsilver:": {
    name: "medalsilver",
    type: "png",
  },
  ":loud:": {
    name: "loud",
    type: "png",
  },
  ":sy1f:": {
    name: "sy1f",
    type: "png",
  },
  ":sy1g:": {
    name: "sy1g",
    type: "png",
  },
  ":sy1h:": {
    name: "sy1h",
    type: "png",
  },
  ":sy1i:": {
    name: "sy1i",
    type: "png",
  },
  ":sy2a:": {
    name: "sy2a",
    type: "png",
  },
  ":sy2b:": {
    name: "sy2b",
    type: "png",
  },
  ":sy2c:": {
    name: "sy2c",
    type: "png",
  },
  ":sy2d:": {
    name: "sy2d",
    type: "png",
  },
  ":sy2e:": {
    name: "sy2e",
    type: "png",
  },
  ":sy2f:": {
    name: "sy2f",
    type: "png",
  },
  ":sy2g:": {
    name: "sy2g",
    type: "png",
  },
  ":sy2h:": {
    name: "sy2h",
    type: "png",
  },
  ":sy2i:": {
    name: "sy2i",
    type: "png",
  },
  ":sy3a:": {
    name: "sy3a",
    type: "png",
  },
  ":sy3b:": {
    name: "sy3b",
    type: "png",
  },
  ":sy3c:": {
    name: "sy3c",
    type: "png",
  },
  ":sy3d:": {
    name: "sy3d",
    type: "png",
  },
  ":sy3e:": {
    name: "sy3e",
    type: "png",
  },
  ":sy3f:": {
    name: "sy3f",
    type: "png",
  },
  ":sy3g:": {
    name: "sy3g",
    type: "png",
  },
  ":sy3h:": {
    name: "sy3h",
    type: "png",
  },
  ":sy3i:": {
    name: "sy3i",
    type: "png",
  },
  ":sy4a:": {
    name: "sy4a",
    type: "png",
  },
  ":sy4b:": {
    name: "sy4b",
    type: "png",
  },
  ":sy4c:": {
    name: "sy4c",
    type: "png",
  },
  ":sy4d:": {
    name: "sy4d",
    type: "png",
  },
  ":sy4e:": {
    name: "sy4e",
    type: "png",
  },
  ":sy4f:": {
    name: "sy4f",
    type: "png",
  },
  ":sy4g:": {
    name: "sy4g",
    type: "png",
  },
  ":sy4h:": {
    name: "sy4h",
    type: "png",
  },
  ":sy4i:": {
    name: "sy4i",
    type: "png",
  },
  ":sy5a:": {
    name: "sy5a",
    type: "png",
  },
  ":sy5b:": {
    name: "sy5b",
    type: "png",
  },
  ":sy5c:": {
    name: "sy5c",
    type: "png",
  },
  ":sy5d:": {
    name: "sy5d",
    type: "png",
  },
  ":sy5e:": {
    name: "sy5e",
    type: "png",
  },
  ":sy5f:": {
    name: "sy5f",
    type: "png",
  },
  ":sy5g:": {
    name: "sy5g",
    type: "png",
  },
  ":sy5h:": {
    name: "sy5h",
    type: "png",
  },
  ":sy5i:": {
    name: "sy5i",
    type: "png",
  },
  ":sy6a:": {
    name: "sy6a",
    type: "png",
  },
  ":sy6b:": {
    name: "sy6b",
    type: "png",
  },
  ":sy6c:": {
    name: "sy6c",
    type: "png",
  },
  ":sy6d:": {
    name: "sy6d",
    type: "png",
  },
  ":sy6e:": {
    name: "sy6e",
    type: "png",
  },
  ":sy6f:": {
    name: "sy6f",
    type: "png",
  },
  ":sy6g:": {
    name: "sy6g",
    type: "png",
  },
  ":sy6h:": {
    name: "sy6h",
    type: "png",
  },
  ":sy6i:": {
    name: "sy6i",
    type: "png",
  },
  ":sy7a:": {
    name: "sy7a",
    type: "png",
  },
  ":sy7b:": {
    name: "sy7b",
    type: "png",
  },
  ":sy7c:": {
    name: "sy7c",
    type: "png",
  },
  ":sy7d:": {
    name: "sy7d",
    type: "png",
  },
  ":sy7e:": {
    name: "sy7e",
    type: "png",
  },
  ":sy7f:": {
    name: "sy7f",
    type: "png",
  },
  ":sy7g:": {
    name: "sy7g",
    type: "png",
  },
  ":sy7h:": {
    name: "sy7h",
    type: "png",
  },
  ":sy7i:": {
    name: "sy7i",
    type: "png",
  },
  ":sy8a:": {
    name: "sy8a",
    type: "png",
  },
  ":sy8b:": {
    name: "sy8b",
    type: "png",
  },
  ":sy8c:": {
    name: "sy8c",
    type: "png",
  },
  ":sy8d:": {
    name: "sy8d",
    type: "png",
  },
  ":sy8e:": {
    name: "sy8e",
    type: "png",
  },
  ":sy8f:": {
    name: "sy8f",
    type: "png",
  },
  ":sy8g:": {
    name: "sy8g",
    type: "png",
  },
  ":sy8h:": {
    name: "sy8h",
    type: "png",
  },
  ":sy8i:": {
    name: "sy8i",
    type: "png",
  },
  ":sy9a:": {
    name: "sy9a",
    type: "png",
  },
  ":sy9a:": {
    name: "sy9a",
    type: "png",
  },
  ":sy9b:": {
    name: "sy9b",
    type: "png",
  },
  ":sy9c:": {
    name: "sy9c",
    type: "png",
  },
  ":sy9d:": {
    name: "sy9d",
    type: "png",
  },
  ":sy9e:": {
    name: "sy9e",
    type: "png",
  },
  ":taco:": {
    name: "taco",
    type: "gif",
  },
  ":thomas:": {
    name: "thomasoface",
    type: "png",
  },
  ":thonk:": {
    name: "thonk",
    type: "png",
  },
  ":tiger:": {
    name: "tiger",
    type: "png",
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
    type: "png",
  },
  ":unicorn:": {
    name: "unicorn",
    type: "png",
  },
  ":werewolf:": {
    name: "werewolf",
    type: "png",
  },
  ":wink:": {
    name: "wink",
    type: "png",
  },
  ":wolf:": {
    name: "wolf",
    type: "png",
  },
  ":yum:": {
    name: "yum",
    type: "gif",
  },
  ":zzz:": {
    name: "zzz",
    type: "png",
  },
  "<3": {
    name: "heart",
    type: "png",
  },
  ">:(": {
    name: "frown",
    type: "png",
  },
  o_o: {
    name: "confused",
    type: "png",
  },
  zzz: {
    name: "zzz",
    type: "png",
  },
  ":golb:": {
    name: "golb",
    type: "png",
  },
};

export const EmoteKeys = Object.keys(Emotes);
