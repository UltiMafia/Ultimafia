"""Ultimafia rule classifier — prompt + client v2 (post-feedback).

Changes vs v1:
  * OGI: referencing outside-game info / personal meta / strategy guides is ALLOWED;
    the line is threats, rule-accusations, non-game leverage, outside posting,
    links to past games used as evidence, pregame pacts, pretending to cheat.
  * cheating: multi-accounting IN THE SAME GAME; saying "X is my alt" is not cheating.
  * GRA: announcing/urging an in-game quit; NOT defensive rule talk.
  * explicit anti-over-flagging instruction.
  * compact choice criteria, and batch support (N messages per request).

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
    raise SystemExit("API key %s not found" % KEY_NAME)


# (id, rules-text body, short gloss used as choice criteria)
CATEGORIES = [
    ("intolerance",
     "Be accepting. Bigotry or group-based disrespect: racism, homophobia, transphobia, misogyny, "
     "religious discrimination, xenophobia, ableism; slurs or derogatory/bigoted language (even "
     "'reclaimed', or used by a member of the group); bypassing slur filters; denying or minimising "
     "genocide or systemic oppression.",
     "Bigotry, slurs or group-based disrespect"),
    ("personal_attacks_harassment",
     "Be respectful. A meaningful insult or attack on another user, regardless of intent or game "
     "state: attacks on intelligence or ability; targeted deliberate antagonisation; conduct meant to "
     "intimidate or demean even when 'justified'; continuing conduct already flagged as upsetting "
     "('stop clause'); impersonation or accounts made to defame/frame.",
     "Insulting, harassing or demeaning another user"),
    ("instigation",
     "Be civil. Intentionally provoking or escalating conflict: trolling (concern/political), "
     "spamming messages, starting or encouraging a large public argument, disingenuously promoting "
     "drama or division.",
     "Trolling, spamming or starting a public argument"),
    ("hazing",
     "Welcome new players. Mistreating someone because they are new: policy-based voting against new "
     "users without merit, falsely accusing new users of rule violations, discouraging growth.",
     "Mistreating players because they are new"),
    ("doxxing",
     "Respect Privacy. Revealing another user's personal or identifying information without consent: "
     "real names, locations or addresses, ages.",
     "Revealing someone's personal information"),
    ("adult_content",
     "Keep it PG13. Content inappropriate for under-18s: graphic sexual description, promotion of "
     "illegal drug use or substance abuse, lewd or sexually explicit language, content meant to shock "
     "or offend (gore, shock sites), links to pornography, depiction of real violence or assault.",
     "Sexual, lewd or PG13-breaking content"),
    ("illegal",
     "Follow the law. Illegal or potentially illegal activity: unlawful interaction involving a "
     "minor, CSAM, promotion of terrorism or organised crime, credible threats of real-world violence "
     "or harm.",
     "Illegal activity or credible real-world threats"),
    ("insufficient_participation",
     "Stay engaged. Failing to participate meaningfully in a ranked/competitive game: diverting to "
     "unrelated activities, faking AFK, using only gimmicks instead of participating, discussing only "
     "unrelated topics.",
     "Not participating, or faking AFK"),
    ("outside_game_influence",
     "Keep the game within the game (OGI). Do not use tools or processes from OUTSIDE the "
     "ranked/competitive game to gain an advantage.\n"
     "     VIOLATES:\n"
     "     - Threatening to report another player, or accusing another player of breaking a rule "
     "during the game.\n"
     "     - Telling another player they are 'throwing'/'gamethrowing' because of how they voted "
     "(this accuses them of a rule break).\n"
     "     - Bribing, or threatening any consequence unrelated to the game.\n"
     "     - Making pregame pacts.\n"
     "     - Posting on profiles, lobbies, forums or the Ultimafia Discord during the game.\n"
     "     - Sending another player a LINK to a past game, or similar outside evidence, in order to "
     "PROVE your meta or read. The problem is the outside evidence itself: it makes the claim into "
     "something the other player cannot deny. Merely asserting meta, without such evidence, is fine.\n"
     "     - Pretending to cheat or to break a rule.\n"
     "     DOES NOT VIOLATE - all of the following are ALLOWED:\n"
     "     - Referring to things from outside the current game in general, including a previous game "
     "you both played in ('after you said something last night').\n"
     "     - Sharing AND ACTING ON your own read or meta about how another player plays. You may "
     "say 'my meta on XYZ says they are mafia', vote for them, or push the town to condemn them, "
     "purely because their play matches their scum game in your eyes. ('Kai is a good player', "
     "'he's a pillar of UM', 'I respect you because we've played before' are fine too.)\n"
     "     - Referencing strategies, on-site strategy guides, forum posts or a player's known habits "
     "as part of your in-game reasoning. Citing or discussing a strategy is NOT using outside-game "
     "influence; the violation is the act of communicating through outside channels during the game "
     "to influence it, not mentioning their content.\n"
     "     - Saying that something is not reportable or arguing about what the rules do or do not "
     "allow.",
     "Using outside-game info as leverage to win (OGI)"),
    ("antagonization",
     "Keep the game fun. Bad-faith play meant to antagonise: intentionally and repeatedly disrupting "
     "gameplay, bad-faith gameplay such as 'hip-firing' (shooting on no or minimal information), or "
     "communication whose primary intent is to provoke or upset another user.",
     "Bad-faith play intended to antagonise"),
    ("game_related_abandonment",
     "Play it out until the end (GRA). Announcing or carrying out LEAVING ('suing'/'suiciding') a "
     "ranked or competitive game for an IN-GAME reason: losing, disliking your role, being wronged, "
     "or disliking how the game is going. Urging another player to do this is also a violation "
     "(abetting).\n"
     "     NOT a violation: a player defending themselves or discussing the rules - e.g. 'you can't "
     "report me for GT', 'I would never sue'; nor leaving for a genuine real-life emergency.\n"
     "     Also NOT abandonment: saying you have lost motivation, that you will 'stop trying', or "
     "that you are playing badly. Those are gamethrowing, which is not judged here at all. GRA is "
     "only about actually quitting the game.",
     "Abandoning the game for in-game reasons (suing)"),
    ("exploits",
     "Report bugs and exploits. Using or abusing a bug or exploit in a ranked/competitive game, or "
     "hiding one from the admins.",
     "Using or hiding a bug or exploit"),
    ("cheating",
     "Do not cheat. Extreme manipulation for unfair advantage. Multi-accounting ('alting') means "
     "playing in the SAME game with two or more accounts. Also: communicating with participants by "
     "external means during a game, sharing in-game information (e.g. screenshots) to prove "
     "alignment, coordinating externally for a particular outcome.\n"
     "     NOT cheating: saying that an account is your alt, or discussing alts, when that account "
     "is not playing in the same game.",
     "Multi-accounting in the same game, or external coordination"),
    ("abetting",
     "Abetting. Encouraging or facilitating another user to break the game rules, e.g. urging "
     "someone to abandon the game ('sue'), spam, or cheat.",
     "Urging someone else to break a rule"),
]

CATEGORY_IDS = [c[0] for c in CATEGORIES]


def rules_block():
    lines = [
        "ULTIMAFIA RULES OF CONDUCT",
        "You are judging one or more chat messages sent in the in-game chat of a game on Ultimafia,",
        "a web chat-mafia site. For each target message decide whether IT breaks Ultimafia's rules.",
        "Use the surrounding chat only as context.",
        "",
        "The possible violation categories are:",
        "",
    ]
    for i, (cid, desc, _g) in enumerate(CATEGORIES, 1):
        lines.append("%d. %s: %s" % (i, cid, desc))
        lines.append("")
    lines += [
        "SITE GLOSSARY",
        "The following are ordinary in-game terms on this site. They are NOT violations and NOT",
        "insults, even when they superficially look like they might be. Treating ordinary in-game",
        "use of them as a violation is a FALSE POSITIVE:",
        "- dumbtell: acting dumb on purpose to avoid suspicion. A technical, strategic term - NOT",
        "  an insult and not a personal attack.",
        "- gt / gamethrow: gamethrowing (see the exclusion above). Merely using the abbreviation, or",
        "  discussing it in the abstract, is not a violation. ACCUSING or telling another player that",
        "  they are gamethrowing - including terse forms like 'u gt', 'he gt', 'ur gt' - IS an Outside",
        "  Game Influence violation, exactly like accusing them of any other rule break.",
        "- hc: 'hard claim' (e.g. 'hc cop' means the speaker claims cop).",
        "- fos: 'finger of suspicion' - a light read, not a serious accusation.",
        "- bw: a light, tentative read expressed in chat.",
        "- carol: a role/mechanic reference.",
        "- ate: game slang for consuming an action, a kill or information.",
        "- meta: knowledge of how a player behaves from past games. Explicitly allowed (see OGI).",
        "- wifom: a standard mafia reasoning term ('wine in front of me').",
        "- omgus: a standard mafia term for a retaliatory vote.",
        "- policy / PL: voting someone out for a claimed rule violation rather than for reads.",
        "- hip-firing: shooting on no or minimal information (an Antagonisation concern, not OGI).",
        "",
        "HOW TO JUDGE",
        "- If the target message breaks none of these categories, it is not a violation.",
        "- Pick the single most applicable category when there is a violation.",
        "- DO NOT OVER-FLAG. Do not flag a message merely because it contains a rule-related word",
        "  ('report', 'GT', 'suicide', 'sue', 'alt', 'meta', 'cheat'). The message itself must",
        "  actually break the rule.",
        "- Ordinary game talk is NOT a violation: accusing someone of being mafia, arguing about",
        "  votes, discussing strategy or strategy guides, banter, sarcasm, or stating an opinion",
        "  about how well someone plays.",
        "- If a reasonable moderator would not act on the message, do not flag it.",
        "- EXCLUDED RULE: 'Play to win' / gamethrowing (intentionally acting against your own win",
        "  condition) is deliberately NOT judged, because a player's intentions cannot be inferred",
        "  reliably. Ignore it - except that accusing another player of gamethrowing is itself an",
        "  outside-game-influence violation, since it accuses them of a rule break.",
        "- A threat to leave a game for an in-game reason ('I'm suing', 'suiciding') IS a violation",
        "  even before the player actually leaves.",
    ]
    return "\n".join(lines)


def _criteria():
    c = {cid: gloss for cid, _d, gloss in CATEGORIES}
    c["no_violation"] = "The target message breaks no Ultimafia rule"
    return c


def build_questions(batch=1):
    """Batch=1 -> single-message question ids; batch=N -> per-item ids v0.., c0.., s0.."""
    qs = {}
    crit = _criteria()
    for k in range(batch):
        if batch == 1:
            vid, cid_, sid = "policy_violation", "violation_type", "severity"
            who = "the TARGET MESSAGE"
        else:
            vid, cid_, sid = "v%d" % k, "c%d" % k, "s%d" % k
            who = "the target message in ITEM %d" % (k + 1)
        qs[vid] = {"type": "noul", "instructions":
                   "Does %s break at least one of the Ultimafia rules of conduct described above? "
                   "Answer yes only when the message itself actually breaks a listed rule." % who}
        qs[cid_] = {"type": "choice",
                    "instructions": "If %s definitely breaks one of the rules above, choose the single "
                                    "best-fitting category for it. Otherwise - or if it is merely "
                                    "borderline - choose 'no_violation'. Selecting a violation "
                                    "category is a claim that the message clearly breaks that rule." % who,
                    "criteria": crit}
        qs[sid] = {"type": "score",
                   "instructions": "How serious is the rule-breaking in %s?" % who,
                   "criteria": ["No rule broken",
                                "Barely a violation, mild or joking",
                                "Clear but moderate violation",
                                "Serious violation needing moderator attention"]}
    return qs


def build_state(target_line, context_lines, game_context):
    parts = ["=== RULES ===", rules_block(), "", "=== GAME CONTEXT ===", game_context, "",
             "=== RECENT CHAT, oldest first ==="]
    parts.extend(context_lines if context_lines else ["(no earlier messages)"])
    parts += ["", "=== TARGET MESSAGE (judge this one) ===", target_line]
    return "\n".join(parts)


def build_batch_state(items):
    """items: list of {context_lines, target_line, game_context}"""
    parts = ["=== RULES ===", rules_block(), "",
             "You must judge each ITEM below INDEPENDENTLY. Items come from different games and",
             "must not influence one another."]
    for k, it in enumerate(items):
        parts += ["", "=== ITEM %d ===" % (k + 1), "GAME CONTEXT: " + it["game_context"],
                  "RECENT CHAT (oldest first):"]
        parts.extend(it["context_lines"] if it["context_lines"] else ["(no earlier messages)"])
        parts += ["TARGET MESSAGE: " + it["target_line"]]
    return "\n".join(parts)


def systemone(state, questions, api_key, model="jev-latest", timeout=120):
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


def parse_answers(resp, batch=1):
    """-> list of dicts (one per item) with noul/choice/choice_conf/probs/severity."""
    a = resp.get("answers", {})
    out = []
    for k in range(batch):
        vid, cid_, sid = ("policy_violation", "violation_type", "severity") if batch == 1 \
            else ("v%d" % k, "c%d" % k, "s%d" % k)
        vt = a.get(cid_, {}) or {}
        sv = a.get(sid, {}) or {}
        out.append({"noul": (a.get(vid, {}) or {}).get("noul"),
                    "choice": vt.get("choice"), "choice_conf": vt.get("confidence"),
                    "probs": vt.get("probabilities"), "severity": sv.get("score"),
                    "severity_conf": sv.get("confidence")})
    return out
