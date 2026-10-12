# OpenVoterGuide

A free, open-source, nonpartisan voter guide platform. Currently serving Ashtabula County, Ohio for the November 3, 2026 general election.

## What is this?

OpenVoterGuide is a searchable, interactive website that helps voters understand their ballot. It covers:

- **Candidate races** with backgrounds, campaign promises, voting records, and promise-vs-record analysis
- **Ballot measures** explained in plain English with neutral YES/NO implications
- **Property tax levies** with millage rates, cost estimates, and renewal vs. new tax breakdowns
- **Personal worksheet** to privately mark choices (stored only in your browser, nothing tracked)
- **Candidate comparison** tables to see all candidates side by side

Strictly nonpartisan. No endorsements, no recommendations, no partisan framing. Candidate pages include research sources; claim-by-claim citations are still being improved.

## Live Site

[https://openvoterguide.org/](https://openvoterguide.org/)

## For Voters

Just visit the site. Search for candidates, races, or measures. Mark your choices on the worksheet. Print a reference sheet. Nothing leaves your browser.

## For Developers & Other Counties

This platform is designed to be reusable. Election data lives in `data/` as structured JSON, separate from the presentation code.

### Adding your county/election

1. Create `data/{state}-{county}-{year}-{type}/` (e.g. `data/oh-lake-2026-general/`)
2. Copy the JSON files from `data/oh-ashtabula-2026-general/` as templates
3. Fill in your races, candidates, measures, and levies following `docs/SCHEMA.md`
4. Document your sources in `VERIFICATION.md`
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

### Tech stack

- **Static site generator:** Eleventy (11ty)
- **Hosting:** GitHub Pages
- **Static, no account system or database, no site-operated analytics or traffic counter**
- **Build:** `npm run build` outputs to `_site/`
- **Tests:** `npm test` builds the site and checks worksheet storage, import, and privacy behavior

### Local development

```bash
npm install
npm run start
```

Visit `http://localhost:8080`.

The [Privacy Policy](https://openvoterguide.org/privacy/) describes local worksheet storage and optional third-party services. [Terms of Use](https://openvoterguide.org/terms/) explains the guide's independent, informational role.

## Data & Verification

The candidate and issue lists were checked against the county Board of Elections documents dated Rev. 9-15-26 on October 11, 2026. This verifies ballot coverage and official issue details; candidate background, position, and voting-record summaries still need claim-by-claim source checks. The guide currently includes 20 races with 45 listed candidate entries or tickets, 2 measures, 36 property-tax levies, and 3 precinct-specific liquor questions.

See `data/oh-ashtabula-2026-general/VERIFICATION.md` for the full source manifest.

## License

MIT License. See [LICENSE](LICENSE) for details. Free to use, fork, and modify.

## Contributing

We welcome contributions, especially:

- New counties/elections (following the data schema)
- Bug fixes and accessibility improvements
- Documentation improvements

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributions must maintain strict nonpartisanship.

