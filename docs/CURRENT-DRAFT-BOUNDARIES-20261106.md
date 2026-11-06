# Current-corpus draft validation boundaries

The private 469-input current-epoch rehearsal still failed after source identifier compatibility was fixed. It exposed two representation boundaries: a legal cumulative book progression exceeded the schema's per-level limit, and a native Foundry condition-immunity ID was resolved through an unrelated third-party catalog condition.

## Cumulative book entries

The existing structured derivation sums at most twenty separately validated increments of 0–100 entries. Its output can therefore reach 2,000; applying the individual-increment maximum of 100 to that cumulative output rejects otherwise representable drafts. Only `classModel.bookProgression` now permits 0–2,000 across at most twenty levels. Input increments and known, prepared, cantrip and slot progression limits are unchanged. No entry is truncated and no player choice or spell is automatically supplied.

The Web class-choice helper still has its earlier capacity guard and its browser validator has not yet adopted this schema. A coordinated consumer change and acceptance remain necessary. This producer change does not claim that 308 supports larger spellbooks or establish a new choice prerequisite in manual-sheet mode.

## Native condition-immunity identifiers

`system.traits.ci.value` is a native wire-ID field. The primary [Foundry DND5E configuration at 87e94dbd9f930135e0694cd7e7d49f210603cd2c](https://github.com/foundryvtt/dnd5e/blob/87e94dbd9f930135e0694cd7e7d49f210603cd2c/module/config.mjs) explicitly associates the `ci` trait with `conditionTypes`. The verified file is 163,970 bytes, Git blob `5357e5ab0dc282788e69830052dfe3694ef748e2`, SHA-256 `2d36ae984b48cb4d48bb54d0e41ac6a1123ab2b9ac5f975c72ed0022c9922134`.

The mapper now checks the 26 declared native IDs directly, including the pseudo-condition IDs, without importing their behavior or inferring a rule edition. In the actual current inputs, the former fallback for `diseased` found a condition from third-party source BA and emitted its display-case English name. Adding or removing that unrelated catalog entry must not change the native immunity. Native source identity, 2014/2024 separation and all effect ownership/lifecycle restrictions remain in their existing owners.

Unknown native IDs remain explicit gaps. In particular, a `poison` damage code is not rewritten to the `poisoned` condition, and a custom catalog condition cannot invent a native immunity ID. Timed, disabled and item effects still do not grant unconditional ownership modifiers; unreviewed migration versions remain rejected. Other custom effect-status namespaces require their own review and are outside this native `ci` mapping.

## Evidence and limits

The initial seven-case regression had six failures and one pass. The first combined run retained one invalid item fixture without migration version 3; correcting that fixture preserved the original migration rejection and all assertions. The four focused suites then passed 293 tests. Browser/producer validation and source-built/checked-in standalone generation also passed, including independence from the unrelated catalog condition and preserving the other progression limits.

A fresh full current-input derive must be bound to the exact producer commit and immutable input hashes before a complete draft can be accepted. The earlier invalid draft and failures remain private evidence. Source snapshots, aliases, input corrections, existing public execution receipts, runtime player state and protocol are unchanged.

This is draft representation compatibility. It does not approve source content, promote a record beyond `needsAnnotation`, adopt the new corpus in Web, or add whole-rule modeling, execution or acceptance credit.
