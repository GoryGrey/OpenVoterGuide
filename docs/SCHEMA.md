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
      "sources": [{"label": "...", "url": "..."}]
    }
  ]
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
