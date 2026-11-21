"""Evaluation suite for the AI Matching feature.

Run from the backend folder with ONE command:

    python -m evals.run

This calls the real Claude API (needs ANTHROPIC_API_KEY) with every case in
evals/golden_set.json and checks the results against the thresholds below.
It exits with code 1 if any check is below its threshold, which fails the
Eval stage of the CI pipeline.

Options:
    --runs N     how many times to run each golden case (default 3)
    --offline    use a fake "perfect" model to test this script itself
                 (no API key or cost; NOT a real evaluation)

Checks:
    accuracy       the top match is the expected found item (or no match
                   when none is expected)
    hallucination  (a) Claude never returns a found-item id we didn't send it
                   (b) Claude never gives a confident match (score >= 70) to
                       the wrong item
    consistency    repeated runs of the same case give the same top match
    bias           counterfactual pairs that differ only in who the owner is
                   (name, gender, religion, ...) give the same top match and
                   scores within 20 points
"""

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from types import SimpleNamespace

from items import ai

HERE = Path(__file__).resolve().parent
GOLDEN_SET = HERE / "golden_set.json"
RESULTS_FILE = HERE / "results" / "latest.json"

# A match counts as the model's answer only if it's at least this confident.
CONFIDENT_SCORE = 70

THRESHOLDS = {
    "accuracy": 0.80,                  # >= 80% of runs pick the right item
    "invented_ids": 0,                 # no made-up item ids, ever
    "no_confident_wrong_match": 0.85,  # >= 85% of runs have no confident wrong match
    "consistency": 0.85,               # >= 85% of cases agree across all runs
    "bias": 0.875,                     # >= 7 of 8 counterfactual pairs agree
    "max_bias_score_gap": 20,
}


def to_item(data: dict) -> SimpleNamespace:
    """Turn a JSON item into the same shape as a Django Item for items.ai."""
    return SimpleNamespace(
        pk=data.get("id", "lost"),
        title=data["title"],
        category=data["category"],
        color=data.get("color", ""),
        location=data["location"],
        date=date.fromisoformat(data["date"]),
        description=data.get("description", ""),
    )


def run_once(client, lost: SimpleNamespace, found: list) -> dict:
    """One call to Claude. Returns the top match and what's needed for checks."""
    candidates = ai.pick_candidates(lost, found)
    valid_ids = {str(item.pk) for item in candidates}
    try:
        raw = ai.ask_claude_to_match(client, lost, candidates)
        raw_ids = [str(m.get("id")) for m in raw.get("matches", []) if isinstance(m, dict)]
        matches = ai.clean_matches(raw, valid_ids)
    except ai.AIUnavailable as error:
        return {"error": str(error), "top": "ERROR", "top_score": 0, "invented": [], "confident": []}
    confident = [m for m in matches if m["score"] >= CONFIDENT_SCORE]
    return {
        "top": confident[0]["id"] if confident else None,
        "top_score": confident[0]["score"] if confident else 0,
        "confident": [m["id"] for m in confident],
        "invented": [i for i in raw_ids if i not in valid_ids],
        "matches": matches,
    }


class OracleClient:
    """Fake model for --offline: answers every golden case perfectly."""

    def __init__(self, golden: dict):
        self.answers = {}
        for case in golden["cases"]:
            self.answers[case["lost"]["description"]] = case["expected_match"]
        for pair in golden["bias_pairs"]:
            base = next(c for c in golden["cases"] if c["id"] == pair["base"])
            self.answers[pair["a"]] = self.answers[pair["b"]] = base["expected_match"]
        self.messages = self

    def create(self, **kwargs):
        lost = json.loads(kwargs["messages"][0]["content"].split("FOUND items:")[0][len("LOST report:"):])
        expected = self.answers.get(lost["description"])
        matches = [{"id": expected, "score": 95, "reason": "oracle"}] if expected else []
        text = SimpleNamespace(type="text", text=json.dumps({"matches": matches}))
        return SimpleNamespace(content=[text])


def make_client(offline: bool, golden: dict):
    if offline:
        return OracleClient(golden)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("ANTHROPIC_API_KEY is not set. Add it to backend/.env or use --offline.")
    import anthropic

    # More retries than the app: the suite sends many requests in a row.
    return anthropic.Anthropic(timeout=60.0, max_retries=5)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()

    try:
        from dotenv import load_dotenv  # same .env file as Django

        load_dotenv(HERE.parent / ".env")
    except ImportError:
        pass

    golden = json.loads(GOLDEN_SET.read_text(encoding="utf-8"))
    found = [to_item(item) for item in golden["found_items"]]
    cases = {case["id"]: case for case in golden["cases"]}
    client = make_client(args.offline, golden)

    # Build every API call up front, then run them in parallel.
    jobs = []
    for case in golden["cases"]:
        for run in range(args.runs):
            jobs.append(("case", case["id"], run, to_item(case["lost"])))
    for pair in golden["bias_pairs"]:
        base = cases[pair["base"]]["lost"]
        for side in ("a", "b"):
            jobs.append(("bias", pair["id"], side, to_item({**base, "description": pair[side]})))

    model = "offline-oracle" if args.offline else ai.get_model()
    print(f"Model: {model}   Prompt: {ai.MATCH_PROMPT_VERSION}   API calls: {len(jobs)}")
    started = time.time()
    with ThreadPoolExecutor(max_workers=4) as pool:
        outputs = list(pool.map(lambda job: run_once(client, job[3], found), jobs))
    results = {(kind, key, run): out for (kind, key, run, _), out in zip(jobs, outputs)}

    # ---- accuracy + hallucination + consistency over golden cases ----
    total_runs = correct_runs = clean_runs = consistent_cases = 0
    invented = []
    errors = []
    case_rows = []
    for case in golden["cases"]:
        expected = case["expected_match"]
        runs = [results[("case", case["id"], r)] for r in range(args.runs)]
        tops = [out["top"] for out in runs]
        for out in runs:
            total_runs += 1
            correct_runs += out["top"] == expected
            clean_runs += out["top"] != "ERROR" and all(i == expected for i in out["confident"])
            invented += out["invented"]
            if "error" in out:
                errors.append(f"{case['id']}: {out['error']}")
        consistent = len(set(tops)) == 1 and tops[0] != "ERROR"
        consistent_cases += consistent
        status = "ok" if all(t == expected for t in tops) else "MISS"
        case_rows.append((case["id"], expected or "none", ", ".join(t or "none" for t in tops), status, case["note"]))

    # ---- bias (counterfactual pairs) ----
    bias_pass = 0
    bias_rows = []
    for pair in golden["bias_pairs"]:
        a, b = results[("bias", pair["id"], "a")], results[("bias", pair["id"], "b")]
        gap = abs(a["top_score"] - b["top_score"])
        same = a["top"] == b["top"] and a["top"] != "ERROR" and gap <= THRESHOLDS["max_bias_score_gap"]
        bias_pass += same
        bias_rows.append((pair["id"], pair["about"], f"{a['top'] or 'none'} ({a['top_score']})",
                          f"{b['top'] or 'none'} ({b['top_score']})", "ok" if same else "DIFFERENT"))

    n_pairs = len(golden["bias_pairs"])
    scores = {
        "accuracy": correct_runs / total_runs,
        "invented_ids": len(invented),
        "no_confident_wrong_match": clean_runs / total_runs,
        "consistency": consistent_cases / len(golden["cases"]),
        "bias": bias_pass / n_pairs,
    }
    passed = {
        name: (value <= THRESHOLDS[name] if name == "invented_ids" else value >= THRESHOLDS[name])
        for name, value in scores.items()
    }

    # ---- report ----
    print("\nGolden cases (expected -> top match of each run)")
    for row in case_rows:
        print(f"  {row[0]}  expected {row[1]:<5} got [{row[2]}]  {row[3]:<4}  {row[4]}")
    print("\nBias pairs (top match (score) for version a vs b)")
    for row in bias_rows:
        print(f"  {row[0]}  {row[1]:<28} {row[2]:<12} vs {row[3]:<12} {row[4]}")
    if errors:
        print("\nAPI errors:")
        for line in errors:
            print("  " + line)
    if invented:
        print(f"\nInvented ids returned by the model: {sorted(set(invented))}")

    print("\nCheck                       Result    Threshold   Pass")
    labels = {
        "accuracy": "Accuracy",
        "invented_ids": "Hallucination: made-up ids",
        "no_confident_wrong_match": "Hallucination: wrong match",
        "consistency": "Consistency (repeat runs)",
        "bias": "Bias (counterfactual pairs)",
    }
    for name, value in scores.items():
        limit = THRESHOLDS[name]
        shown = f"{value}" if name == "invented_ids" else f"{value:.0%}"
        need = f"<= {limit}" if name == "invented_ids" else f">= {limit:.1%}"
        print(f"  {labels[name]:<26} {shown:<9} {need:<11} {'PASS' if passed[name] else 'FAIL'}")
    print(f"\nFinished in {time.time() - started:.1f}s")

    RESULTS_FILE.parent.mkdir(exist_ok=True)
    RESULTS_FILE.write_text(json.dumps({
        "model": model,
        "prompt": ai.MATCH_PROMPT_VERSION,
        "runs_per_case": args.runs,
        "scores": scores,
        "thresholds": THRESHOLDS,
        "passed": passed,
        "cases": case_rows,
        "bias_pairs": bias_rows,
        "errors": errors,
    }, indent=2))

    if all(passed.values()):
        print("EVAL PASSED")
        return 0
    print("EVAL FAILED: at least one check is below its threshold.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
