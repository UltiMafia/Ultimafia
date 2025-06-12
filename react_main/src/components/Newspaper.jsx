import React, { useEffect, useState } from "react";

import { emotify, Emotes } from "./Emotes"
import { Avatar } from "../pages/User/User";
import Typewriter from 'typewriter-effect';

import "../css/newspaper.css";

const speedModifier = 1;

const TIMINGS = {
    initialDelay: 1000,

    // Post-typing delays
    newspaperHeader: 1000 / speedModifier,
    newspaperSubheader: 0 / speedModifier,
    initialNoOneDiedDelay: 3000 / speedModifier,

    initialObituaryDelay: 3000  / speedModifier,
    obituaryHeader: 1000 / speedModifier,
    obituaryDeathMessage: 3000 / speedModifier,
    obituaryRevealMessage: 3000 / speedModifier,
    obituaryLastWill: 0 / speedModifier,

    // Delays between "keystrokes"
    newspaperHeaderDelay: 30 / speedModifier,
    newspaperSubheaderDelay: 10 / speedModifier,
    noOneDiedDelay: 10 / speedModifier,
    obituaryHeaderDelay: 20 / speedModifier,
    obituaryDeathMessageDelay: 10 / speedModifier,
    obituaryRevealMessageDelay: 10 / speedModifier,
    obituaryLastWilleDelay: 10 / speedModifier,
}

const SKIP_HEADER_ANIMATION = false;

const PHASE_IN_SECS = 1 / speedModifier;
const PHASE_IN_MS = PHASE_IN_SECS * 1000;

const DEBUG = false;

function ChainedTypewriter(props) {
    const text = props.text;
    const staticText = props.staticText || text;
    const initialDelayMs = props.initialDelayMs || 0;
    const delayMs = props.delayMs;
    const chainedFunction = props.chainedFunction;
    const debug = props.debug;
    const sideContent = props.sideContent || null;
    const typingDelay = props.typingDelay || 80;
    const noAnimation = props.noAnimation || false;
    const noChain = props.noChain || false;

    const phaseInFunction = props.phaseInFunction || null;
    const PHASE_IN_MS = props.PHASE_IN_MS || 1000;

    const [isPhasedIn, setIsPhasedIn] = useState(noAnimation ? true : false);

    // The nested visibility: "hidden" -> visibility: "visible" divs enable the text to ALWAYS
    // be left aligned, but because the hidden parent is sized exactly the same way it renders
    // the text in place like a real printing press

    return (
        <>
            <div style={{
                display: "inline-flex",
                flexFlow: "row nowrap",
                visibility: !noAnimation ? "hidden" : "visible",
                position: "relative",
                textAlign: "left", // ALWAYS use left aligned text because the invisible parent is already aligned as we want it
            }}>
                {sideContent && (<div style={{
                    visibility: "visible",
                    marginRight: "8px",
                }}>
                    <div style={{
                        display: "inline-block",
                        height: isPhasedIn ? undefined : "0px",
                        transition: `all ${PHASE_IN_SECS}s`,
                    }}>
                        {sideContent}
                    </div>
                </div>)}
                <div style={{
                    display: "inline",
                    position: "relative",
                }}>
                    {!noAnimation && (<span style={{
                        display: "inline-block",
                        visibility: "visible",
                        position: "absolute",
                        width: "101%" // This is some magic sauce. yepppp.
                    }}>
                        <Typewriter
                            options={{
                                cursor: "",
                                delay: typingDelay,
                                skipAddStyles: true,
                            }}
                            onInit={(typewriter) => {
                                // Start defining chained functions
                                if (debug) typewriter = typewriter.callFunction(() => { console.log(`=============== start ${debug}`) });

                                if (debug) typewriter = typewriter.callFunction(() => { console.log(`${debug} initialDelayMs ${initialDelayMs}`) });
                                if(initialDelayMs > 0) typewriter = typewriter.pauseFor(initialDelayMs);

                                if (debug) typewriter = typewriter.callFunction(() => { console.log(`${debug} phaseInFunction`) });
                                if(phaseInFunction) typewriter = typewriter.callFunction(() => { phaseInFunction() });

                                if (debug) typewriter = typewriter.callFunction(() => { console.log(`${debug} PHASE_IN_MS ${PHASE_IN_MS}`) });
                                if(PHASE_IN_MS > 0) typewriter = typewriter.pauseFor(PHASE_IN_MS);

                                if (debug) typewriter = typewriter.callFunction(() => { console.log(`${debug} setIsPhasedIn true`) });
                                typewriter = typewriter.callFunction(() => { setIsPhasedIn(true); });
                                
                                if (debug) typewriter = typewriter.callFunction(() => { console.log(`${debug} typeString ${text}`) });
                                typewriter = typewriter.typeString(text);

                                if (debug) typewriter = typewriter.callFunction(() => { console.log(`${debug} delayMs ${delayMs}`) });
                                if(delayMs > 0) typewriter = typewriter.pauseFor(delayMs);

                                if (debug) typewriter = typewriter.callFunction(() => { console.log(`${debug} chainedFunction`) });
                                if(chainedFunction && !noChain) typewriter = typewriter.callFunction(() => { chainedFunction(); });
                                // End defining chained functions

                                typewriter.start();
                            }}
                        />
                    </span>)}
                    <span style={{
                        display: "inline-block",
                        width: "101%",
                    }}>
                        {staticText}
                    </span>
                </div>
            </div>
        </>
    );
}

function PhaseInSection(props) {
    const content = props.content;
    const phaseIn = props.phaseIn;

    // Try to get the max height as low as possible without ever letting the content exceed it
    const maxHeight = props.maxHeight || "100px";

    return (<div style={{
        overflow: "hidden",
        transition: `all ${PHASE_IN_SECS}s`,
        margin: phaseIn ? undefined : "0px",
        maxHeight: phaseIn ? maxHeight : "0px",
    }}>
        {content}
    </div>);
}

function ObituaryItem({death, onFullyAnimated, parentProps}) {
    const roleName = getRoleName(death.revealMessage);
    const reformattedRoleName = reformatRoleName(roleName);

    const noAnimation = parentProps.noAnimation || false;

    // STATIC vs NOT STATIC: why?
    // We have two separate ways of generating the content of these pieces because
    // the typewriter uses text ONLY, while the static text uses normal react
    // JSX stuff. The static and non-static version of the content MUST align else
    // stuff will look janky. Beware.

    const deathMessage = emotifyInline(death.deathMessage);
    const deathMessageStatic = emotify(death.deathMessage);

    const revealMessage = `${death.name}'s role was: <span class="newspaper-emphasis">${reformattedRoleName}</span>`;
    const revealMessageStatic = (<>
        {death.name}
        's role was:
        <span className="newspaper-emphasis"> {reformattedRoleName}</span>
    </>);

    const lastWill = death.lastWill ? emotifyInline(death.lastWill) : null;
    const lastWillStatic = death.lastWill ? emotify(death.lastWill) : null;

    const [animatedHeader, setAnimatedHeader] = useState(noAnimation ? true : false);
    const [animatedDeathMessage, setAnimatedDeathMessage] = useState(noAnimation ? true : false);
    const [animatedRevealMessage, setAnimatedRevealMessage] = useState(noAnimation ? true : false);

    const [phaseInHeader, setPhaseInHeader] = useState(noAnimation ? true : false);
    const [phaseInDeathMessage, setPhaseInDeathMessage] = useState(noAnimation ? true : false);
    const [phaseInRevealMessage, setPhaseInRevealMessage] = useState(noAnimation ? true : false);
    const [phaseInLastWill, setPhaseInLastWill] = useState(noAnimation ? true : false);

    return (<div className="obituary" key={death.id} style={{
            transition:  `all ${PHASE_IN_SECS}s`,
            margin: phaseInHeader ? undefined : "0px",
        }}>
        <PhaseInSection
            key={"obituary-header"}
            phaseIn={phaseInHeader}
            content={<div className="obituary-header">
                <ChainedTypewriter
                    text={death.name}
                    initialDelayMs={TIMINGS.initialObituaryDelay}
                    delayMs={TIMINGS.obituaryHeader}
                    typingDelay={TIMINGS.obituaryHeaderDelay}
                    chainedFunction={() => setAnimatedHeader(true)}
                    debug={DEBUG ? "obituaryHeader" : undefined}
                    noAnimation={noAnimation}
                    PHASE_IN_MS={PHASE_IN_MS}
                    phaseInFunction={() => setPhaseInHeader(true)}
                />
            </div>}
        />
        {animatedHeader && (<PhaseInSection
            key={"obituary-death-message"}
            phaseIn={phaseInDeathMessage}
            maxHeight={200}
            content={<div className="newspaper-paragraph">
                <ChainedTypewriter
                    text={deathMessage}
                    staticText={deathMessageStatic}
                    delayMs={TIMINGS.obituaryDeathMessage}
                    typingDelay={TIMINGS.obituaryDeathMessageDelay}
                    chainedFunction={() => setAnimatedDeathMessage(true)}
                    debug={DEBUG ? "obituaryDeathMessage" : undefined}
                    sideContent={
                        <div className="obituary-avatar">
                            <Avatar
                                id={death.id}
                                hasImage={death.avatar}
                                avatarId={death.avatarId}
                                name={death.name}
                                /* deckProfile={props.deckProfile} */
                                large
                                isSquare
                            />
                        </div>
                    }
                    noAnimation={noAnimation}
                    PHASE_IN_MS={PHASE_IN_MS}
                    phaseInFunction={() => setPhaseInDeathMessage(true)}
                />
            </div>}
        />)}
        {animatedDeathMessage && (<PhaseInSection
            key={"obituary-reveal-message"}
            phaseIn={phaseInRevealMessage}
            content={<div className="newspaper-paragraph">
                <ChainedTypewriter
                    text={revealMessage}
                    staticText={revealMessageStatic}
                    delayMs={TIMINGS.obituaryRevealMessage}
                    typingDelay={TIMINGS.obituaryRevealMessageDelay}
                    chainedFunction={() => { setAnimatedRevealMessage(true); if(!lastWill) onFullyAnimated(); }}
                    debug={DEBUG ? "obituaryRevealMessage" : undefined}
                    noAnimation={noAnimation}
                    PHASE_IN_MS={PHASE_IN_MS}
                    phaseInFunction={() => setPhaseInRevealMessage(true)}
                />
            </div>}
        />)}
        {lastWill && animatedRevealMessage && (<PhaseInSection
            key={"obituary-last-will"}
            phaseIn={phaseInLastWill}
            content={<div className="newspaper-paragraph">
                <ChainedTypewriter
                    text={lastWill}
                    staticText={lastWillStatic}
                    delayMs={TIMINGS.obituaryLastWill}
                    typingDelay={TIMINGS.obituaryLastWilleDelay}
                    chainedFunction={() => { onFullyAnimated(); }}
                    debug={DEBUG ? "obituaryLastWill" : undefined}
                    noAnimation={noAnimation}
                    PHASE_IN_MS={PHASE_IN_MS}
                    phaseInFunction={() => setPhaseInLastWill(true)}
                />
            </div>}
        />)}
    </div>);
}

export default function Newspaper(props) {
    const title = props.title || "Obituary";
    const timestamp = props.timestamp || Date.now();
    const noAnimation = props.noAnimation || false;
    const deaths = props.deaths || [];
    const dayCount = props.dayCount || 0;
    const onFullyAnimated = props.onFullyAnimated || null;
    
    // Example props.deaths input data:
    /* [{
        id: "l-jKFhbq6",
        name: "nearbear",
        avatar: true,
        avatarId: "l-jKFhbq6",
        deathMessage: "nearbear :zzz: died :zzz: while :zzz: testing :zzz: this :zzz: new :zzz: feature",
        revealMessage: "nearbear's role is Prankster:Insane/Telepathic",
        lastWill: ":will: nearbear did not leave a will."
    }, {
        id: "asdfasdf",
        name: "TheGameGuy",
        avatar: false,
        avatarId: "asdfasdf",
        deathMessage: "n1 TheGameGuy if you are jealous that he is better than you at EpicMafia. You can make up a fake excuse if you want to.",
        revealMessage: "TheGameGuy's role is Cop:Insane",
        lastWill: ":will: As read from TheGameGuy's last will: I knew you guys were jealous."
    }] */

    const [animatedTitle, setAnimatedTitle] = useState(noAnimation || SKIP_HEADER_ANIMATION ? true : false);
    const [animatedSubheader, setAnimatedSubheader] = useState(noAnimation || SKIP_HEADER_ANIMATION ? true : false);
    const [animatedObituaryCount, setAnimatedObituaryCount] = useState(noAnimation ? deaths.length : 0);
    const [animatedNoOneDied, setAnimatedNoOneDied] = useState(noAnimation ? true : false);
    const animationFullyComplete = deaths.length > 0 ? (animatedObituaryCount == deaths.length) : animatedNoOneDied;

    useEffect(() => {
        if (animationFullyComplete && onFullyAnimated) {
            onFullyAnimated();
        }
    }, [animationFullyComplete]);
    
    const [phaseInTitle, setPhaseInTitle] = useState(noAnimation || SKIP_HEADER_ANIMATION ? true : false);
    const [phaseInSubheader, setPhaseInSubheader] = useState(noAnimation || SKIP_HEADER_ANIMATION ? true : false);
    const [phaseInNoOneDied, setPhaseInNoOneDied] = useState(noAnimation ? true : false);

    // Subtract 100 years from the game's start time to get MAFIA time
    var gameDate = new Date(timestamp + (dayCount * 24*60*60*1000));
    gameDate.setFullYear(gameDate.getFullYear() - 100);

    const obituaries = deaths.map((death, i) => {
        if (i > animatedObituaryCount) {
            return <></>;
        }
        else {
            return <ObituaryItem
                key={death.id}
                death={death}
                onFullyAnimated={() => { setAnimatedObituaryCount(animatedObituaryCount + 1); }}
                parentProps={props}
            />
        }
    });

    const noOneDied = obituaries.length === 0;

    return (
        <div className="newspaper">
            <PhaseInSection
                key={"newspaper-title"}
                phaseIn={phaseInTitle}
                content={<div className="newspaper-title">
                    <ChainedTypewriter
                        text={title}
                        initialDelayMs={TIMINGS.initialDelay}
                        delayMs={TIMINGS.newspaperHeader}
                        typingDelay={TIMINGS.newspaperHeaderDelay}
                        chainedFunction={() => {setAnimatedTitle(true); }}
                        debug={DEBUG ? "newspaperHeader" : undefined}
                        textAlign="center"
                        noAnimation={noAnimation || SKIP_HEADER_ANIMATION}
                        PHASE_IN_MS={PHASE_IN_MS}
                        phaseInFunction={() => setPhaseInTitle(true)}
                    />
                </div>}
            />
            {animatedTitle && (<PhaseInSection
                key={"newspaper-subheader"}
                phaseIn={phaseInSubheader}
                content={<div className="newspaper-subheader">
                    <ChainedTypewriter
                        text={gameDate.toDateString()}
                        delayMs={TIMINGS.newspaperSubheader}
                        typingDelay={TIMINGS.newspaperSubheaderDelay}
                        chainedFunction={() => setAnimatedSubheader(true)}
                        debug={DEBUG ? "newspaperSubheader" : undefined}
                        textAlign="center"
                        noAnimation={noAnimation || SKIP_HEADER_ANIMATION}
                        PHASE_IN_MS={PHASE_IN_MS}
                        phaseInFunction={() => setPhaseInSubheader(true)}
                    />
                </div>}
            />)}
            {animatedSubheader && !noOneDied && obituaries}
            {animatedSubheader && noOneDied && (<PhaseInSection
                key={"no-one-died"}
                phaseIn={phaseInNoOneDied}
                content={<div className="newspaper-no-one-died">
                    <ChainedTypewriter
                        text={"No one died last night."}
                        initialDelayMs={TIMINGS.initialNoOneDiedDelay}
                        typingDelay={TIMINGS.noOneDiedDelay}
                        chainedFunction={() => setAnimatedNoOneDied(true)}
                        debug={DEBUG ? "noOneDied" : undefined}
                        textAlign="center"
                        noAnimation={noAnimation || SKIP_HEADER_ANIMATION}
                        PHASE_IN_MS={PHASE_IN_MS}
                        phaseInFunction={() => setPhaseInNoOneDied(true)}
                    />
                </div>}
            />)}
        </div>
    );
}

const ROLE_SEARCH_TERM = "'s role is ";
function getRoleName(text) {
    if (!text) return "???";

    const indexStart = text.lastIndexOf(ROLE_SEARCH_TERM);
    const indexEnd = indexStart + ROLE_SEARCH_TERM.length;

    return text.substring(indexEnd, text.length);
}

function reformatRoleName(role) {
    const tokens = role.split(":")
    var roleName = tokens[0];
    var modifiers = tokens.length > 1 ? tokens[1].split("/") : [""];

    return `${modifiers.join(" ")} ${roleName}`;
}

// We use a custom function here because the typewriter class doesn't like anything but string
function emotifyInline(text) {
  if (text == null) return;

  if (!Array.isArray(text)) text = [text];

  for (let i in text) {
    let segment = text[i];

    if (typeof segment != "string") continue;

    const words = segment.split(" ");

    for (let j in words) {
      let word = words[j].toLowerCase();

      // Checking if Emote dictionary contains the word. Custom emotes have precedence
      if (Emotes[word] && typeof Emotes[word] != "function") {
        const emote = Emotes[word];
        words[j] = `<div class="emote" title=${emote.name} style="background-image: url('/images/emotes/${emote.name.toLowerCase()}.${emote.type}')"></div>`;
      } else {
        if (j < words.length - 1) {
          // do NOT append an extra ' ' space in the last word (which wasn't there in the first place)
          words[j] += " ";
        }
      }
    }

    text[i] = words;
  }

  const result = text.flat().join("");
  return result;
}
