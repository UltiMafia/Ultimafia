import React, { useContext, useRef, useState } from "react";

import { emotify } from "./Emotes";
import { RoleCount } from "./Roles";
import { Avatar } from "../pages/User/User";
import Typewriter from 'typewriter-effect';

import "../css/newspaper.css";

const TIMINGS = {
    initialDelay: 0,

    // Post typing delays
    newspaperHeader: 1000,
    newspaperSubheader: 1000,
    obituaryHeader: 1000,
    obituaryDeathMessage: 3000,
    obituaryRevealMessage: 0,
    obituaryLastWill: 0,
}

const DEBUG = false;

function ChainedTypewriter(props) {
    const text = props.text;
    const initialDelayMs = props.initialDelayMs || 0;
    const delayMs = props.delayMs;
    const chainedFunction = props.chainedFunction;
    const debug = props.debug;
    const preBlockContent = props.preBlockContent || null;
    const typingDelay = props.typingDelay || 80;

    if (debug) console.log(`============ Entering ${debug}`);

    // The nested visibility: "hidden" -> visibility: "visible" divs enable the text to ALWAYS
    // be left aligned, but because the hidden parent is sized exactly the same way it renders
    // the text in place like a real printing press

    return (
        <>
            {preBlockContent && (<div style={{
                display: "inline",
                visibility: "visible",
                float: "right",
            }}>
                {preBlockContent}
            </div>)}
            <div style={{
                display: "inline",
                visibility: "hidden",
                position: "relative",
                textAlign: "justify", // ALWAYS use justified text because the invisible parent is already aligned
            }}>
                <div style={{
                    display: "inline",
                    visibility: "visible",
                    position: "absolute",
                    width: "101%" // This is some magic sauce. yepppp.
                }}>
                    <Typewriter
                        options={{
                            cursor: "",
                            delay: typingDelay,
                        }}
                        onInit={(typewriter) => { 
                            typewriter
                                .pauseFor(initialDelayMs)
                                .typeString(text)
                                .pauseFor(delayMs)
                                .callFunction(() => { if(chainedFunction) chainedFunction(); })
                                .start();
                        }}
                    />
                </div>
                {text}
            </div>
        </>
    );
}

function ObituaryItem({death, chainedFunction}) {
    const roleName = getRoleName(death.revealMessage);

    // emotified stuff doesn't work with typwriter (yet)

    /* const deathMessage = emotify(death.deathMessage); */
    /* const lastWill = death.lastWill ? emotify(death.lastWill) : null; */
    /* const revealMessage = (
        <>
            {death.name}
            's role was:
            <span className="newspaper-emphasis"> {reformatRoleName(roleName)}</span>
        </>
    ); */

    const deathMessage = death.deathMessage;
    const lastWill = death.lastWill ? death.lastWill : null;
    const revealMessage = `${death.name}'s role was: <span class="newspaper-emphasis">${reformatRoleName(roleName)}</span>`;

    const [animatedHeader, setAnimatedHeader] = useState(false);
    const [animatedDeathMessage, setAnimatedDeathMessage] = useState(false);
    const [animatedRevealMessage, setAnimatedRevealMessage] = useState(false);

    return (<div className="obituary" key={death.id}>
        <div className="obituary-header">
            <ChainedTypewriter
                text={death.name}
                delayMs={TIMINGS.obituaryHeader}
                /* chainedFunction={() => chainedFunction()} */
                chainedFunction={() => setAnimatedHeader(true)}
                debug={DEBUG ? "obituaryHeader" : undefined}
            />
        </div>
        {animatedHeader && (<div className="newspaper-paragraph">
            <ChainedTypewriter
                text={deathMessage} // there is something wrong with this deathmessage
                delayMs={TIMINGS.obituaryDeathMessage}
                typingDelay={50}
                chainedFunction={() => setAnimatedDeathMessage(true)}
                debug={DEBUG ? "obituaryDeathMessage" : undefined}
                preBlockContent={
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
            />
        </div>)}
        {animatedDeathMessage && <div className="newspaper-paragraph">
            <ChainedTypewriter
                text={revealMessage}
                delayMs={TIMINGS.obituaryDeathMessage}
                chainedFunction={() => { setAnimatedRevealMessage(true); if(!lastWill) chainedFunction(); }}
                debug={DEBUG ? "obituaryDeathMessage" : undefined}
                preBlockContent={
                    <div className="obituary-role">
                        <RoleCount
                            role={roleName}
                            gameType={"Mafia"}
                            showSecondaryHover
                            large
                        />
                    </div>
                }
            />
        </div>}
        {lastWill && animatedRevealMessage && (<div className="newspaper-paragraph">
            <ChainedTypewriter
                text={lastWill}
                delayMs={TIMINGS.obituaryDeathMessage}
                chainedFunction={() => { chainedFunction(); }}
                debug={DEBUG ? "obituaryDeathMessage" : undefined}
                typingDelay={50}
            />
        </div>)}
    </div>);
}

export default function Newspaper(props) {
    const title = props.title || "Breaking News";
    const timestamp = props.timestamp || Date.now();
    const deaths = props.deaths || [{
        id: "l-jKFhbq6",
        name: "nearbear",
        avatar: true,
        avatarId: "l-jKFhbq6",
        deathMessage: "nearbear died while testing this new feature :zzz:",
        revealMessage: "nearbear's role is Prankster:Insane/Telepathic",
        lastWill: ":will: nearbear did not leave a will."
    }, {
        id: "asdfasdf",
        name: "TheGameGuy",
        avatar: false,
        avatarId: "asdfasdf",
        deathMessage: "n1 TheGameGuy if you are jealous that he is better than you at EpicMafia. You can make up a fake excuse if you want to.",
        revealMessage: "TheGameGuy's role is Cop:Insane",
        lastWill: "I knew you guys were jealous."
    }];

    const [animatedTitle, setAnimatedTitle] = useState(false);
    const [animatedSubheader, setAnimatedSubheader] = useState(false);
    const [animatedObituaryCount, setAnimatedObituaryCount] = useState(0);

    // Subtract 100 years from the game's start time to get MAFIA time
    var gameDate = new Date(timestamp);
    gameDate.setFullYear(gameDate.getFullYear() - 100);

    const obituaries = deaths.map((death, i) => {
        if (i > animatedObituaryCount) {
            return <></>;
        }
        else {
            return <ObituaryItem
                key={death.id}
                death={death}
                chainedFunction={() => { setAnimatedObituaryCount(animatedObituaryCount + 1); }}
            />
        }
    });

    return (
        <div className="newspaper">
            <div className="newspaper-title">
                <ChainedTypewriter
                    text={title}
                    initialDelayMs={TIMINGS.initialDelay}
                    delayMs={TIMINGS.newspaperHeader}
                    chainedFunction={() => {setAnimatedTitle(true); }}
                    debug={DEBUG ? "newspaperHeader" : undefined}
                    textAlign="center"
                    typingDelay={160}
                />
            </div>
            {animatedTitle && (<div className="newspaper-subheader">
                <ChainedTypewriter
                    text={gameDate.toDateString()}
                    delayMs={TIMINGS.newspaperSubheader}
                    chainedFunction={() => setAnimatedSubheader(true)}
                    debug={DEBUG ? "newspaperSubheader" : undefined}
                    textAlign="center"
                />
            </div>)}
            {animatedSubheader && obituaries}
        </div>
    );
}

const ROLE_SEARCH_TERM = "'s role is ";
function getRoleName(text) {
    const indexStart = text.lastIndexOf(ROLE_SEARCH_TERM);
    const indexEnd = indexStart + ROLE_SEARCH_TERM.length;

    return text.substring(indexEnd, text.length);
}

function reformatRoleName(role) {
    var roleName = role.split(":")[0];
    var modifiers = role.split(":")[1].split("/") || [""];

    return `${roleName} (${modifiers.join(", ")})`;
}
