"""Claude (Anthropic API) helpers for the Lost & Found app.

User stories:
- AI Matching & Search (Epic 3): suggest found items that may match a lost report.
- Item Descriptions (Epic 6): suggest a title, category, color, and description
  from a photo of a found item, so staff can log items faster.

Prompts live in versioned files in backend/prompts/ (see prompts/README.md).

The API key is read from the ANTHROPIC_API_KEY environment variable (backend/.env
locally, GitHub Secrets in CI). It stays on the server and is never sent to the
browser.

Fallback path (see README "LLM Feature > Fallback Path"):
- Matching: if Claude is turned off, fails, times out, or returns output that
  doesn't follow the schema, suggest_matches() uses fallback_matches(), a simple
  rule-based matcher, and labels the result source="fallback".
- Item Descriptions: describe_photo() raises AIUnavailable; the view returns
  HTTP 503 and the form stays as it was, so staff fill it in by hand.

Privacy: only item details (title, category, color, location, date, description,
photo) are sent to Claude. Reporter names and emails are never sent.

This module does not import Django, so the evaluation suite (backend/evals/)
can run it with only the `anthropic` package installed.
"""

import base64
import json
import logging
import os
import re
from pathlib import Path

logger = logging.getLogger(__name__)

# Haiku is Anthropic's cheapest and fastest model, and it can read images.
# Override with ANTHROPIC_MODEL in .env to try another model (then re-run evals).
DEFAULT_MODEL = "claude-haiku-5-5"

# Seconds to wait for Claude before giving up and using the fallback.
TIMEOUT_SECONDS = 20.0

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
MATCH_PROMPT_VERSION = "match_items_v1"
DESCRIBE_PROMPT_VERSION = "describe_item_v1"

# How many found items to send to Claude for one lost report.
MAX_CANDIDATES = 40

# Matches below this score are dropped.
MIN_MATCH_SCORE = 40

# Keep these in sync with frontend/src/reportOptions.ts.
ITEM_CATEGORIES = [
    "Accessories",
    "Bags & Backpacks",
    "Books & School Supplies",
    "Clothing",
    "Electronics",
    "ID & Cards",
    "Keys",
    "Jewelry",
    "Wallets & Money",
    "Water Bottles",
]

ITEM_COLORS = [
    "Black", "White", "Gray", "Silver", "Gold", "Brown", "Beige", "Red",
    "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "Clear", "Multicolor",
]


class AIUnavailable(Exception):
    """Claude couldn't give a usable answer (no key, error, timeout, bad output)."""


def load_prompt(version: str) -> str:
    return (PROMPTS_DIR / f"{version}.txt").read_text(encoding="utf-8").strip()


def get_model() -> str:
    return os.environ.get("ANTHROPIC_MODEL") or DEFAULT_MODEL


def get_client():
    """Return an Anthropic client, or raise AIUnavailable if there's no key."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise AIUnavailable("AI is turned off: ANTHROPIC_API_KEY is not set on the server.")
    import anthropic  # imported here so the app still starts without the package

    return anthropic.Anthropic(timeout=TIMEOUT_SECONDS, max_retries=1)


def ask_claude_for_json(client, *, system: str, content, schema: dict, max_tokens: int = 2048) -> dict:
    """Send one message to Claude and return its reply as a dict.

    Uses structured outputs (output_config.format) so the reply should be JSON
    matching `schema`. Any failure raises AIUnavailable.
    """
    try:
        response = client.messages.create(
            model=get_model(),
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": content}],
            output_config={"format": {"type": "json_schema", "schema": schema}},
        )
    except Exception as error:  # network problems, timeouts, bad key, rate limits, ...
        # Details go to the server log, not to the user.
        logger.warning("Claude API call failed: %r", error)
        raise AIUnavailable(
            "The AI service is not available right now. Please try again later."
        ) from error

    # The reply may also contain "thinking" blocks; the JSON is in the text block.
    for block in getattr(response, "content", None) or []:
        if getattr(block, "type", None) == "text":
            try:
                answer = json.loads(block.text)
            except (TypeError, json.JSONDecodeError) as error:
                raise AIUnavailable("The AI service returned an unreadable answer.") from error
            if not isinstance(answer, dict):
                raise AIUnavailable("The AI service returned an unexpected answer.")
            return answer
    raise AIUnavailable("The AI service returned an empty answer.")


# ---------------------------------------------------------------------------
# AI Matching & Search
# ---------------------------------------------------------------------------

MATCH_SCHEMA = {
    "type": "object",
    "properties": {
        "matches": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "score": {"type": "integer"},
                    "reason": {"type": "string"},
                },
                "required": ["id", "score", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["matches"],
    "additionalProperties": False,
}


def item_summary(item) -> dict:
    """The details of an item that are sent to Claude (no personal info)."""
    return {
        "id": str(item.pk),
        "title": item.title,
        "category": item.category,
        "color": item.color,
        "location": item.location,
        "date": str(item.date),
        "description": (item.description or "")[:500],
    }


def pick_candidates(lost_item, found_items, limit: int = MAX_CANDIDATES) -> list:
    """Choose which found items to consider.

    Same-category items go first (newest first, as the queryset is ordered),
    then everything else, up to `limit`. Items found before the lost date are
    skipped because they can't be the lost item.
    """
    found_items = [
        item for item in found_items
        if not (item.date and lost_item.date and item.date < lost_item.date)
    ]
    same = [item for item in found_items if item.category == lost_item.category]
    other = [item for item in found_items if item.category != lost_item.category]
    return (same + other)[:limit]


def clean_matches(answer: dict, valid_ids: set[str]) -> list[dict]:
    """Check Claude's answer and keep only valid matches, best first.

    Raises AIUnavailable if the answer doesn't have the expected shape, so the
    caller can use the fallback. Ids that weren't sent to Claude (hallucinated
    items) are dropped.
    """
    raw = answer.get("matches")
    if not isinstance(raw, list):
        raise AIUnavailable("The AI answer is missing the list of matches.")
    matches, seen = [], set()
    for match in raw:
        if not isinstance(match, dict):
            raise AIUnavailable("The AI answer has a badly formed match.")
        match_id = str(match.get("id", ""))
        score = match.get("score")
        if isinstance(score, bool) or not isinstance(score, (int, float)):
            raise AIUnavailable("The AI answer has a match without a numeric score.")
        score = max(0, min(100, int(score)))
        if match_id not in valid_ids:
            logger.info("Dropped AI match with unknown id %r", match_id)
            continue
        if match_id in seen or score < MIN_MATCH_SCORE:
            continue
        seen.add(match_id)
        matches.append({
            "id": match_id,
            "score": score,
            "reason": str(match.get("reason", ""))[:300],
        })
    matches.sort(key=lambda match: match["score"], reverse=True)
    return matches


_WORD = re.compile(r"[a-z0-9]+")
_STOP_WORDS = {"a", "an", "the", "and", "or", "of", "with", "my", "in", "on", "for"}


def _words(text: str) -> set[str]:
    return {word for word in _WORD.findall((text or "").lower()) if word not in _STOP_WORDS}


def _building(location: str) -> str:
    # "Greenley Library - 2nd floor" -> "greenley library"
    return (location or "").split(" - ")[0].strip().lower()


def fallback_matches(lost_item, candidates) -> list[dict]:
    """Rule-based matching used when Claude can't answer.

    Needs the same category plus at least one more matching detail (color,
    words in the name, or building). Less clever than Claude, but it never
    invents items and never fails.
    """
    lost_words = _words(lost_item.title)
    matches = []
    for item in candidates:
        if item.category != lost_item.category:
            continue
        score, reasons = 50, ["same category"]
        if lost_item.color and item.color and lost_item.color.lower() == item.color.lower():
            score += 20
            reasons.append("same color")
        shared = lost_words & _words(item.title)
        if shared:
            score += 20
            reasons.append("similar name")
        if _building(lost_item.location) and _building(lost_item.location) == _building(item.location):
            score += 10
            reasons.append("same building")
        if score >= 70:
            matches.append({
                "id": str(item.pk),
                "score": score,
                "reason": "Basic match: " + ", ".join(reasons) + ".",
            })
    matches.sort(key=lambda match: match["score"], reverse=True)
    return matches


def build_match_prompt(lost_item, candidates) -> str:
    """The user message for matching. User-typed text is pasted in as JSON."""
    return (
        "LOST report:\n"
        + json.dumps(item_summary(lost_item), indent=1)
        + "\n\nFOUND items:\n"
        + json.dumps([item_summary(item) for item in candidates], indent=1)
    )


def ask_claude_to_match(client, lost_item, candidates) -> dict:
    """Claude's raw matching answer (used by the app and by the eval suite)."""
    return ask_claude_for_json(
        client,
        system=load_prompt(MATCH_PROMPT_VERSION),
        content=build_match_prompt(lost_item, candidates),
        schema=MATCH_SCHEMA,
    )


def suggest_matches(lost_item, found_items, client=None) -> tuple[list[dict], str]:
    """Suggest found items that may match `lost_item`.

    Returns (matches, source). matches is a list of {"id", "score", "reason"}
    sorted best first; source is "ai" or "fallback".
    """
    candidates = pick_candidates(lost_item, found_items)
    if not candidates:
        return [], "ai"

    try:
        client = client or get_client()
        answer = ask_claude_to_match(client, lost_item, candidates)
        return clean_matches(answer, {str(item.pk) for item in candidates}), "ai"
    except AIUnavailable as error:
        logger.info("Using fallback matching: %s", error)
        return fallback_matches(lost_item, candidates), "fallback"


# ---------------------------------------------------------------------------
# Item Descriptions (from a photo)
# ---------------------------------------------------------------------------

DESCRIBE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "category": {"type": "string", "enum": ITEM_CATEGORIES},
        "color": {"type": "string", "enum": ITEM_COLORS},
        "description": {"type": "string"},
    },
    "required": ["title", "category", "color", "description"],
    "additionalProperties": False,
}


def describe_photo(photo_bytes: bytes, content_type: str, client=None) -> dict:
    """Ask Claude to suggest title, category, color, and description for a photo.

    Raises AIUnavailable on any failure (the form then stays unchanged).
    """
    client = client or get_client()
    content = [
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": content_type,
                "data": base64.standard_b64encode(photo_bytes).decode("ascii"),
            },
        },
        {"type": "text", "text": "Fill in the found item report for this photo."},
    ]
    answer = ask_claude_for_json(
        client,
        system=load_prompt(DESCRIBE_PROMPT_VERSION),
        content=content,
        schema=DESCRIBE_SCHEMA,
    )
    title = answer.get("title")
    if not isinstance(title, str) or not title.strip():
        raise AIUnavailable("The AI answer is missing an item name.")
    return {
        "title": title.strip()[:200],
        # Values outside the dropdown lists are left blank for staff to choose.
        "category": answer.get("category") if answer.get("category") in ITEM_CATEGORIES else "",
        "color": answer.get("color") if answer.get("color") in ITEM_COLORS else "",
        "description": str(answer.get("description", ""))[:1000],
    }
