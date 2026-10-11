# OpenVoterGuide

A free, open-source, nonpartisan voter guide platform. Currently serving Ashtabula County, Ohio for the November 3, 2026 general election.

## What is this?

OpenVoterGuide is a searchable, interactive website that helps voters understand their ballot. It covers:

- **Candidate races** with backgrounds, campaign promises, voting records, and promise-vs-record analysis
- **Ballot measures** explained in plain English with neutral YES/NO implications
- **Property tax levies** with millage rates, cost estimates, and renewal vs. new tax breakdowns
- **Personal worksheet** to privately mark choices (stored only in your browser, nothing tracked)
- **Candidate comparison** tables to see all candidates side by side

Strictly nonpartisan. No endorsements, no recommendations, no partisan framing. Every claim links to its source.

## Live Site

[https://gorygrey.github.io/OpenVoterGuide/](https://gorygrey.github.io/OpenVoterGuide/)

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
- **No backend, no database, no tracking**
- **Build:** `npm run build` outputs to `_site/`

### Local development

```bash
npm install
npm run start
```

Visit `http://localhost:8080`.

## Data & Verification

All Ashtabula County data was verified against the official Board of Elections candidate list (Rev. 9-15-26) and issues sheet (Rev. 9-15-26) on October 11, 2026.

See `data/oh-ashtabula-2026-general/VERIFICATION.md` for the full source manifest.

## License

MIT License. See [LICENSE](LICENSE) for details. Free to use, fork, and modify.

## Contributing

We welcome contributions, especially:

- New counties/elections (following the data schema)
- Bug fixes and accessibility improvements
- Documentation improvements

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributions must maintain strict nonpartisanship.
