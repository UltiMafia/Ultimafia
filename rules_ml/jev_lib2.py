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
    ("personal_attacks_harassment",
     "Be respectful and accepting. ABUSE: a direct insult aimed at a PERSON, or bigotry aimed at a "
     "GROUP. Either counts, even in a single message - flag it.\n"
     "     PERSON-DIRECTED. A DIRECT insult aimed at another PERSON counts, and it counts even in a "
     "single message - flag it.\n"
     "     THE TEST: find the OBJECT of the insult. A violation requires a PERSON as that object - a "
     "named player, 'you'/'u'/'ur', or a group of players. If the object is a play, a read, a vote, "
     "the situation, the speaker themselves, or nothing at all, it is NOT a violation no matter how "
     "strong the language.\n"
     "     VIOLATES: 'you're fucking stupid', 'you are a moron', 'YOU'RE DUMB', 'are you stupid?', "
     "'FUCK U', 'I hate you', 'dumbass', 'you are trash', 'loser', 'stfu' or 'shut the fuck up' when "
     "aimed at a named person ('Cart STFU').\n"
     "     DOES NOT VIOLATE - profanity or an insult word with a NON-PERSON object:\n"
     "       - object is the PLAY: 'that vote is fucking terrible', 'that was a dumb vote', 'ur reads "
     "are trash', 'this is stupid', 'that's dumb'.\n"
     "       - object is the SITUATION or nothing: 'the fucking train is late', 'this fucking traffic', "
     "'they installed the new shit', 'i have done many stupid things today'.\n"
     "       - ordinary chat that merely CONTAINS such a word: 'u got a fucking cc', 'never ask for ot "
     "line don't be a noob', 'hooker read me as blacksmith so they're not noob'.\n"
     "       - an UNTARGETED 'SHUT UP' asking town to quiet down, or ordinary banter.\n"
     "     Same vocabulary, different object: 'you're fucking terrible' VIOLATES, 'that vote is fucking "
     "terrible' does NOT; 'you are a moron' VIOLATES, 'that was a moronic play' does NOT.\n"
     "     GROUP-DIRECTED (same category). Bigotry or group-based disrespect: racism, homophobia, "
     "transphobia, misogyny, religious discrimination, xenophobia, ableism; slurs or derogatory or "
     "bigoted language, including 'reclaimed' use or use by a member of the group; bypassing the "
     "slur filter; denying or minimising genocide or systemic oppression. This is RARE on this site "
     "because the site filters slurs - do not go looking for it, but classify it here when present.\n"
     "     A PATTERN of harassment across several games is a moderator matter, but that is not a "
     "reason to withhold a flag from a clear direct insult in one message.",
     "Abuse: insulting a person, or bigotry aimed at a group"),
    ("hazing",
     "Welcome new players. Mistreating someone because they are new: policy-based voting against new "
     "users without merit, falsely accusing new users of rule violations, discouraging growth.",
     "Mistreating players because they are new"),
    ("doxxing",
     "Respect Privacy. Revealing ANOTHER user's personal or identifying information without their "
     "consent.\n"
     "     VIOLATES: stating or hinting at where another player lives ('bob lives in ohio'), their "
     "real name ('bobs real name is michael'), their age ('bob is 14'), their socials, or claiming "
     "to know these ('i know where you live', 'i know bob's address lol').\n"
     "     NOT a violation: talking about your OWN location or personal details ('im in LA now'). "
     "The violation is exposing someone ELSE's private information.",
     "Revealing another person's private information"),
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
     "     - Announcing, threatening, or urging a LEAVE ('suiciding', 'sui') from a ranked or "
     "competitive game for an IN-GAME reason - losing, disliking your role, being wronged, disliking "
     "how the game is going ('im sui', 'im suiciding', 'just leave'). Urging another player to do this "
     "counts too. Classify ALL of these here: actually leaving a game is an ACTION, not a chat "
     "message, so a message can only ever THREATEN or announce it, and that threat is OGI.\n"
     "       NOTE: 'sue'/'suing' is NOT leave-language on this site. The term for leaving is 'sui' / "
     "'suiciding'. 'sue me' is not a threat to leave and must not be flagged as one.\n"
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
     "allow.\n"
     "     - Defending yourself about leaving, or discussing the rule: 'you can't report me for GT'. "
     "Leaving for a GENUINE real-life emergency is not a violation either.\n"
     "     - Saying you have lost motivation, that you will 'stop trying', or that you are playing "
     "badly. Those are gamethrowing, which is deliberately not judged at all.",
     "Using outside-game info as leverage to win (OGI)"),
    ("antagonization",
     "Keep the game fun. Bad-faith play meant to antagonise: intentionally and repeatedly disrupting "
     "gameplay, bad-faith gameplay such as 'hip-firing' (shooting on no or minimal information), or "
     "communication whose primary intent is to provoke or upset another user.",
     "Bad-faith play intended to antagonise"),
    ("exploits",
     "Report bugs and exploits. Using or abusing a bug or exploit in a ranked/competitive game, or "
     "hiding one from the admins.",
     "Using or hiding a bug or exploit"),
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
        "- gt / gamethrow / gting: gamethrowing (see the exclusion above). Merely using the",
        "  abbreviation, or discussing it in the abstract, is not a violation. ACCUSING or telling",
        "  another player that they are gamethrowing - including terse forms like 'u gt', 'he gt',",
        "  'ur gt', 'you're gting', 'ur gting', 'stop gting' - IS an Outside Game Influence violation,",
        "  exactly like accusing them of any other rule break. The terse forms are NOT too short to",
        "  count: 'you're gting' IS a complete accusation and DOES violate. The general caution against",
        "  flagging on vocabulary alone does NOT apply here, because the accusation IS the violation.",
        "  This is one of the most COMMON violations on the site - do not be shy about it.",
        "- NAMES containing rule words: players use handles like 'Gamethrower11', 'NoobSlayer',",
        "  'DumbtellDan'. A NAME that merely contains a rule-related word is NOT an accusation -",
        "  'gamethrower why you driving a bus over me lmao' addresses a PLAYER CALLED Gamethrower,",
        "  it does not accuse anyone of gamethrowing. Check whether the word is capitalised or refers",
        "  to how someone is addressed before treating it as a rule reference.",
        "- Negated or quoted insults are NOT insults: 'i didn't call you an idiot', 'who called you",
        "  stupid?', \"don't say 'you're an idiot'\" contain an insult word but do not insult anyone,",
        "  because the insult is being DENIED, QUESTIONED or QUOTED rather than made.",
        "- Identity words in negation or jest: 'he's not gay lol', 'are u gay or a gamer' are not",
        "  abuse. The bar for the group-directed part of that category is bigotry or group-based disrespect that is actually",
        "  directed at a group - not every appearance of a word like 'gay' in casual banter.",
        "- hc: 'hard claim' (e.g. 'hc cop' means the speaker claims cop).",
        "- cc: 'counterclaim'. A claim by another player that counters a claim already made - e.g.",
        "  'u got a fucking cc' means 'you have a counterclaim'. A game term, NOT an insult; the",
        "  profanity is not aimed at any person.",
        "- ot: 'on time'/'one more time' style game-chat shorthand ('never ask for ot line'). Ordinary",
        "  game talk, not an insult.",
        "- noob: an ordinary site word for an inexperienced player. Criticising someone's PLAY as",
        "  'noob'-level is NOT a personal attack ('hooker read me as blacksmith so they're not noob').",
        "  Only an insult directed AT a person ('you are such a noob') can be a personal attack.",
        "- fos: 'finger of suspicion' - a light read, not a serious accusation.",
        "- bw: a light, tentative read expressed in chat.",
        "- carol: a role/mechanic reference.",
        "- ate: game slang for consuming an action, a kill or information.",
        "- bomb: a ROLE. A phrase like 'this idiot bomb' names the player HOLDING that role, so the",
        "  insult is aimed at a person and DOES violate. Do not read 'bomb' as a weapon or a threat.",
        "  The same goes for any role name used as a noun in an insult ('this useless cop').",
        "- meta: knowledge of how a player behaves from past games. Explicitly allowed (see OGI).",
        "- wifom: a standard mafia reasoning term ('wine in front of me').",
        "- omgus: a standard mafia term for a retaliatory vote.",
        "- policy / PL: voting someone out for a claimed rule violation rather than for reads.",
        "- hip-firing: shooting on no or minimal information (an Antagonisation concern, not OGI).",
        "- report: on this site 'report' almost always means a COP or other power role's night RESULT",
        "  ('what's your report?', 'per report', 'report them'). That is ordinary game talk and is NOT",
        "  a threat. Only a genuine threat to report a player to the moderators - or using that as",
        "  leverage against them - is an OGI violation.",
        "- alt: talk about whether an account is someone's alt is almost always in jest and is NOT a",
        "  violation.",
        "",
        "HOW TO JUDGE",
        "- If the target message breaks none of these categories, it is not a violation.",
        "- Pick the single most applicable category when there is a violation.",
        "- DO NOT OVER-FLAG. Do not flag a message merely because it contains a rule-related word",
        "  ('report', 'GT', 'suicide', 'sue', 'alt', 'meta', 'cheat'), and do NOT flag it merely",
        "  because it contains PROFANITY or a mild insult ('fucking', 'shit', 'stupid', 'dumb',",
        "  'noob', 'idiot', 'gay', 'trash'). These are extremely common in ordinary chat, in banter,",
        "  and in criticism of PLAY; their presence alone is never enough. For a personal attack the",
        "  message must actually aim the insult at a person. The message itself must",
        "  actually break the rule.",
        "- Ordinary game talk is NOT a violation: accusing someone of being mafia, arguing about",
        "  votes, discussing strategy or strategy guides, banter, sarcasm, or stating an opinion",
        "  about how well someone plays.",
        "- This assessment only warns the sender BEFORE they send, and never decides moderation.",
        "  Prefer catching a likely violation over avoiding a borderline flag: a false alarm costs",
        "  the sender nothing, a missed violation costs the community. BUT 'borderline' means",
        "  borderline on the SUBSTANCE of a rule (is this really an accusation of gamethrowing? is",
        "  this really aimed at a person?). It does NOT mean borderline on vocabulary. A message that",
        "  clearly does not target a person is not borderline, and that bias does not apply to it.",
        "- EXCLUDED RULE: 'Play to win' / gamethrowing (intentionally acting against your own win",
        "  condition) is deliberately NOT judged, because a player's intentions cannot be inferred",
        "  reliably. Ignore it - except that accusing another player of gamethrowing is itself an",
        "  outside-game-influence violation, since it accuses them of a rule break.",
        "- A threat to leave a game for an in-game reason ('im sui', 'im suiciding') IS a violation",
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
