"""Shared library for the Ultimafia rule-violation classifier (Jev / Experiential Labs).

Never prints the API key.
"""
import json
import urllib.request
import urllib.error

API_URL = "https://api.experientiallabs.ai/v1/systemone"
ENV_PATH = "/home/tt/Documents/Ultimafia/.env"
KEY_NAME = "EXPERIENTIAL_LABS_API_KEY"


def load_api_key(path=ENV_PATH):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() == KEY_NAME:
                return v.strip().strip('"').strip("'")
    raise SystemExit("API key %s not found in %s" % (KEY_NAME, path))


# ---------------------------------------------------------------------------
# Rule categories.  `Play to win` / gamethrowing is deliberately EXCLUDED.
# ---------------------------------------------------------------------------
CATEGORIES = [
    ("intolerance",
     "Be accepting - bigotry or group-based disrespect: racism, homophobia, transphobia, "
     "misogyny, religious discrimination, xenophobia, ableism; slurs or derogatory/bigoted "
     "language (even 'reclaimed', or used by a member of the group); bypassing slur filters; "
     "denying or minimising genocide or systemic oppression."),
    ("personal_attacks_harassment",
     "Be respectful - a meaningful insult or attack on another user regardless of intent or game "
     "state: attacks on intelligence or ability; targeted deliberate antagonisation; conduct meant "
     "to intimidate or demean even when 'justified'; continuing conduct already flagged as upsetting "
     "('stop clause'); impersonation or accounts made to defame/frame."),
    ("instigation",
     "Be civil - intentionally provoking or escalating conflict: trolling (concern/political), "
     "spamming messages, starting or encouraging a large public argument, disingenuously promoting "
     "drama or division."),
    ("hazing",
     "Welcome new players - mistreating someone because they are new: policy-based voting against "
     "new users without merit, falsely accusing new users of rule violations, discouraging growth."),
    ("doxxing",
     "Respect Privacy - revealing another user's personal or identifying information without consent: "
     "real names, locations or addresses, ages."),
    ("adult_content",
     "Keep it PG13 - content inappropriate for under-18s: graphic sexual description, promotion of "
     "illegal drug use or substance abuse, lewd or sexually explicit language, content meant to shock "
     "or offend (gore, shock sites), links to pornography, depiction of real violence or assault."),
    ("illegal",
     "Follow the law - illegal or potentially illegal activity: unlawful interaction involving a "
     "minor, CSAM, promotion of terrorism or organised crime, credible threats of real-world violence "
     "or harm."),
    ("insufficient_participation",
     "Stay engaged - failing to participate meaningfully in a ranked/competitive game: diverting to "
     "unrelated activities, faking AFK, using only gimmicks instead of participating, discussing only "
     "unrelated topics."),
    ("outside_game_influence",
     "Keep the game within the game (OGI) - using anything from OUTSIDE the game to aid or influence "
     "your chance of winning a ranked/competitive game. Breaks this rule: threatening to report "
     "another player; accusing another player of breaking a rule (this threatens them with "
     "consequences from outside the game, and includes telling someone they are 'throwing'/'gamethrowing' "
     "because of how they voted); bribing or threatening any non-game consequence; stating or implying "
     "meta information from outside the game (e.g. 'X always plays like this as mafia', 'we played "
     "together last night'); posting on profiles/lobbies/forums/Discord during the game; making "
     "pregame pacts; pretending to cheat or break a rule."),
    ("antagonization",
     "Keep the game fun - bad-faith play meant to antagonise: intentionally and repeatedly disrupting "
     "gameplay, bad-faith gameplay such as 'hip-firing' (shooting on no or minimal information), or "
     "communication whose primary intent is to provoke or upset another user."),
    ("game_related_abandonment",
     "Play it out until the end (GRA) - abandoning a ranked/competitive game for IN-GAME reasons, "
     "i.e. quitting because you are losing, dislike your role, were wronged, or dislike how the game "
     "is going. On-site slang: 'suing' or 'suiciding'. ALSO breaks this rule: announcing that you "
     "intend to do this. Leaving for a genuine real-life emergency does NOT break this rule."),
    ("exploits",
     "Report bugs and exploits - using or abusing a bug/exploit in a ranked/competitive game, or "
     "hiding one from the admins."),
    ("cheating",
     "Do not cheat - extreme manipulation for unfair advantage: multi-accounting ('alting') inside one "
     "game; communicating with participants via external means during a game; sharing in-game "
     "information (e.g. screenshots) to prove alignment or gain advantage; coordinating externally for "
     "a particular outcome."),
    ("abetting",
     "Abetting - encouraging or facilitating another user to break the game rules, e.g. urging someone "
     "to game-related abandon ('sue'), spam, or cheat."),
]

CATEGORY_IDS = [c[0] for c in CATEGORIES]


def rules_block():
    lines = [
        "ULTIMAFIA RULES OF CONDUCT",
        "You are judging ONE chat message sent inside an in-game chat on Ultimafia (a web chat-mafia",
        "site). Decide whether the TARGET MESSAGE breaks Ultimafia's rules of conduct. Judge only the",
        "target message, using the surrounding chat solely as context.",
        "",
        "The possible violation categories are:",
        "",
    ]
    for i, (cid, desc) in enumerate(CATEGORIES, 1):
        lines.append("%d. %s: %s" % (i, cid, desc))
        lines.append("")
    lines += [
        "RULES FOR JUDGING",
        "- If the target message breaks none of these categories, it is not a violation.",
        "- Pick the single most applicable category when there is a violation.",
        "- Ordinary game talk is NOT a violation: accusing someone of being mafia, discussing strategy,",
        "  arguing about votes, trash talk about the game, sarcasm, and jokes that are not aimed at a",
        "  protected group and are not meant to demean another user.",
        "- EXCLUDED RULE: 'Play to win' / gamethrowing (intentionally acting against your own win",
        "  condition) is deliberately NOT judged. Ignore it entirely: do not treat a message as a",
        "  violation merely because it looks like bad play or gamethrowing, EXCEPT that accusing",
        "  another player of gamethrowing is itself an outside-game-influence violation (it accuses",
        "  them of a rule break).",
        "- A threat to leave the game for an in-game reason ('I'm suing', 'suiciding') is a violation",
        "  even before the player actually leaves.",
    ]
    return "\n".join(lines)


def build_questions():
    criteria = {cid: desc.split(" - ", 1)[-1] for cid, desc in CATEGORIES}
    criteria["no_violation"] = "The target message breaks no Ultimafia rule."
    return {
        "policy_violation": {
            "type": "noul",
            "instructions": (
                "Does the TARGET MESSAGE break at least one of the Ultimafia rules of conduct "
                "described above? Answer yes when the message itself clearly breaks a listed rule; "
                "answer no for permitted game talk, strategy, sarcasm, or venting."
            ),
        },
        "violation_type": {
            "type": "choice",
            "instructions": (
                "Which single category best describes the rule the TARGET MESSAGE breaks? "
                "Choose 'no_violation' if it breaks none."
            ),
            "criteria": criteria,
        },
        "severity": {
            "type": "score",
            "instructions": "How serious is the rule-breaking in the TARGET MESSAGE?",
            "criteria": [
                "No rule broken",
                "Barely a violation, very mild or joking and unlikely to need action",
                "Clear but moderate violation",
                "Serious violation requiring moderator attention",
            ],
        },
    }


def build_state(target_line, context_lines, game_context):
    parts = [
        "=== RULES ===",
        rules_block(),
        "",
        "=== GAME CONTEXT ===",
        game_context,
        "",
        "=== RECENT CHAT, oldest first ===",
    ]
    parts.extend(context_lines if context_lines else ["(no earlier messages)"])
    parts += ["", "=== TARGET MESSAGE (judge this one) ===", target_line]
    return "\n".join(parts)


def systemone(state, questions, api_key, model="jev-latest", timeout=90):
    body = json.dumps({"model": model, "state": state, "questions": questions}).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + api_key)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError("HTTP %s: %s" % (e.code, detail[:400]))
