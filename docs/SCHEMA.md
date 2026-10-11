# Election Data Schema

## Directory Structure

```
data/{state}-{county}-{year}-{type}/
  election.json
  races.json
  measures.json
  levies.json
  liquor.json (optional)
  VERIFICATION.md
```

## election.json

```json
{
  "name": "November 3, 2026 General Election",
  "jurisdiction": "Ashtabula County, Ohio",
  "election_date": "2026-11-03",
  "key_dates": [
    {"label": "Election Day", "date": "2026-11-03", "details": "Polls 6:30am-7:30pm"}
  ],
  "boe_contact": {
    "address": "8 W Walnut St, Jefferson, OH 44047",
    "phone": "440-576-6915",
    "website": "https://www.boe.ohio.gov/ashtabula/"
  },
  "verification_date": "2026-10-11"
}
```

## races.json

Array of race objects:

```json
{
  "id": "us-senator",
  "office": "U.S. Senator",
  "district": null,
  "term_info": "Special election...",
  "verification_status": "candidate_list_checked",
  "verification_date": "2026-10-11",
  "candidates": [
    {
      "name": "Jon Husted",
      "party": "Republican",
      "incumbent": true,
      "background": "...",
      "promises": ["..."],
      "record": ["..."],
      "correlation": "...",
      "sources": [{"label": "...", "url": "..."}],
      "response_status": "Optional source-backed note about a response or nonresponse to a named voter guide. A nonresponse must not imply the candidate has no public positions.",
      "measure_positions": [{
        "issue_number": "3",
        "issue_label": "Issue 3: Voter ID amendment",
        "issue_path": "/measures/issue-3/",
        "position": "support",
        "statement": "A short neutral summary of the candidate’s own public statement.",
        "source": {"label": "Candidate interview, date", "url": "https://..."},
        "checked_on": "2026-10-11"
      }]
    }
  ]
}
```

`measure_positions` is optional. Each entry must link to a direct source for the candidate statement. Allowed positions are `support`, `oppose`, or `unclear`; do not infer a position from a party, endorsement, vote, or silence. Omit the field or use an empty array when the guide has not verified a statement. An empty entry means this guide has no sourced statement listed, not that the candidate is undecided.


Candidate narrative claims can carry direct, per-claim evidence in optional `claim_evidence`. Arrays align by index with `background` (one combined background statement), `promises`, `record`, or `correlation`. Evidence statuses are `candidate_statement` (source shows what the candidate said), `official_record` (official public record), or `editorial_summary` (guide interpretation with its supporting references). A source for a candidate statement does not independently verify its factual assertions. Use `pending` with no sources when a claim has been reviewed but still lacks direct support; omit an entry when its source audit has not yet been completed. The page labels missing claim-level citations as pending. Keep the grouped `sources` list as a broader reading list, not as proof of every claim.

```json
"claim_evidence": {
  "promises": [{
    "status": "candidate_statement",
    "note": "Candidate response published as submitted; not independently fact-checked.",
    "checked_on": "2026-10-11",
    "sources": [{"label": "Candidate response", "url": "https://..."}]
  }],
  "record": [{
    "status": "official_record",
    "note": "Official sponsor list; sponsorship does not establish enactment.",
    "checked_on": "2026-10-11",
    "sources": [{"label": "Official legislative record", "url": "https://..."}]
  }]
}
```

## measures.json

```json
{
  "id": "issue-3",
  "issue_number": "3",
  "title": "Voter ID Constitutional Amendment",
  "plain_english": "Neutral 2-3 sentence explanation.",
  "yes_means": "Neutral description of YES outcome.",
  "no_means": "Neutral description of NO outcome.",
  "verification_status": "verified",
  "verification_date": "2026-10-11",
  "sources": [{"label": "...", "url": "..."}]
}
```

## levies.json

```json
{
  "issue_number": "39",
  "jurisdiction": "Sheffield Township",
  "purpose": "Fire & EMS",
  "type": "additional",
  "millage": "4.5",
  "term_years": 5,
  "annual_cost_per_100k": 158,
  "tax_change": true,
  "verification_status": "verified",
  "sources": [{"label": "BOE Issues Sheet", "url": "..."}]
}
```

Types: `renewal`, `additional`, `renewal_increase`, `renewal_reduction`
