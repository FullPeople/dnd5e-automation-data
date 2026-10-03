# dnd5e-automation-data

Independent D&D Card automation IR producer and validator (Node 22.12+).
G1–G5 are complete; the browser gate passed independent review at Web commit
`a804d3be3a16558c874db43ce6e2332a2950ad8b`. G6 reviewed annotation is in progress.
The locked derivation contains 18,789 identities, including 6,396 core-book
records. The final coverage matrix is generated from accepted reviews only;
unreviewed drafts remain `needsAnnotation`.

```sh
npm ci
npm test
npm run build
npm run fetch -- --out .cache/upstream
node --experimental-strip-types src/cli.ts derive --offline --out artifacts
npm run pipeline -- --offline --out .cache/replay
npm run validate -- --file artifacts/automation.json
npm run report -- --cache .cache/upstream --out reports/replay
node scripts/browser-bundle.mjs .cache/browser-share
```

Structured fields and Foundry sidecars produce declarative mechanics. Prose
completeness requires an independently reviewed overlay. Unsupported and
deferred mechanisms are reported separately and never count as automated.
Core editions, full parent identity, hashes and version locks remain distinct.
The safe formula parser accepts a small arithmetic/dice grammar without eval.

The browser bundle contains precompiled strict schema validators and semantic
checks with no runtime package dependencies. Its ten shared files are SHA-256
locked. Web imports the generated files and hashed artifact; it does not import
this repository or its test tooling at runtime.

Raw publisher inputs stay in ignored `.cache/`; do not commit them or player
cards. Public artifacts omit rule bodies and CJK text. This repository retains
**DND Card Noncommercial Share-Alike License 1.0** for migrated source;
third-party data retain their own licenses. Mechanical extracts do not grant
permission to redistribute third-party prose.

See [protocol](docs/PROTOCOL.md), [coverage definition](docs/COVERAGE-DEFINITION.md),
[structured derivation](docs/DERIVATION-RULES.md), [Foundry mapping](docs/FOUNDRY-MAPPING.md)
and [reviewed overlays](docs/OVERLAY-GUIDE.md), plus [execution receipts](docs/RUNBOOKS/). Stage tags support isolated inspection
and reversible commits. Production merge/deployment are outside this branch.
