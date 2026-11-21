# Prompts

Each prompt sent to Claude lives in its own versioned file. Never edit a
released version in place: copy it to `_v2.txt`, change the copy, point
`MATCH_PROMPT_VERSION` / `DESCRIBE_PROMPT_VERSION` in `items/ai.py` at it, and
run the evaluation suite (`python -m evals.run`) to compare.

| File | Feature | User story |
|---|---|---|
| `match_items_v1.txt` | AI Matching | Epic 3: AI Matching & Search |
| `describe_item_v1.txt` | Photo → item details | Epic 6: Item Descriptions |
