# Contributing to Haicuotu

Thanks for helping improve the digitalized Haicuotu archive. This project is
especially useful when contributions make the data more accurate, traceable,
and pleasant to browse.

## Good First Contributions

- Correct typos in creature names, descriptions, or classical text notes.
- Improve modern biological identifications in `src/data/modern-identifications.json`.
- Add citations or caveats for uncertain identifications.
- Report image and text mismatches.
- Report cropped images that include multiple creatures, miss part of a creature, or show the wrong page region.
- Improve accessibility, metadata, SEO, and mobile layout.

## Data Review Principles

When changing creature metadata or identifications:

1. Prefer verifiable sources over guesswork.
2. Keep uncertain identifications marked as uncertain.
3. Preserve the distinction between the original historical record and modern interpretation.
4. Include a short rationale when adding or changing a modern species candidate.
5. Avoid replacing a cautious note with an overconfident claim.

## Local Development

Install dependencies:

```sh
bun install
```

Start Astro in background mode:

```sh
bun x astro dev --background
```

Useful server commands:

```sh
bun x astro dev status
bun x astro dev logs
bun x astro dev stop
```

Build before opening a pull request:

```sh
bun run build
```

## Rebuilding Image and Data Assets

The source PDFs are not committed to Git because of their size. Download the
four source PDFs from the Shuge Haicuotu page and place them in `raw-pdfs/`.

Then run:

```sh
.venv/bin/python3 scripts/rebuild_accurate_database.py
```

To use another PDF directory:

```sh
HAICUOTU_PDF_DIR=/path/to/pdf-folder .venv/bin/python3 scripts/rebuild_accurate_database.py
```

## Pull Request Checklist

- The change is scoped to one clear purpose.
- `bun run build` passes.
- Data changes include rationale or citations when possible.
- Image crop changes are checked visually.
- New text distinguishes original Haicuotu content from modern commentary.
