import React, { useEffect } from "react";
import { Emotes, emotify } from "../../components/Emotes";
import "../../css/emotes.css";

export default function EmoteList() {
	useEffect(() => {
		document.title = "Emotes | BeyondMafia";
	}, []);

	return (
		<div className="span-panel main legal">
			<h1>List of Emotes {emotify(":doge:")}</h1>
            <div>{getEmotes()}</div>
        </div>
	);
    
}

function getEmotes() {
    const emotesList = Object.keys(Emotes);
    return (
        <ul className="emote-list">
            {emotesList.map((emote) => (
                <li key={emote}>
                    {emote} {emotify(emote)}
                </li>
            ))}
        </ul>
    )
}
