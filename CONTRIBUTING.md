# Contributing to the Voter Guide Platform

## Adding Your County/Election

1. Create a new directory: `data/{state}-{county}-{year}-{election-type}/`
2. Copy the JSON schema from `data/oh-ashtabula-2026-general/` as a template
3. Fill in your election data following `docs/SCHEMA.md`
4. Add your verification sources to `VERIFICATION.md` in your data directory
5. Submit a pull request

## Data Requirements

- Every candidate must have at least one source URL
- Every ballot measure must have a plain-English explanation and neutral YES/NO implications
- Every entry must have a `verification_status` and `verification_date`
- Flag disputed or thin claims; do not silently publish unverified information

## Nonpartisanship

This platform is strictly nonpartisan. Contributions must:
- Contain no endorsements or voting recommendations
- Present candidate information factually with sources
- Explain measures neutrally without advocating a position
- Avoid partisan language, framing, or branding

Violations will be rejected.

## Code Contributions

- Keep dependencies minimal
- Ensure the site builds with `npx @11ty/eleventy`
- Test on mobile viewports
- Maintain accessibility (semantic HTML, ARIA labels, keyboard navigation)
