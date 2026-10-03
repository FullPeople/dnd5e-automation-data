# Coverage definition

The denominator is the expanded, deduplicated catalogue for each namespace/source/kind. It includes copies, subraces, versions and concrete magic items; it does not include monsters. G1 reports preserve their original provisional identity and candidate counts. They are never relabeled as final automation coverage.

Final reports partition every canonical record into exactly one verdict:

| Verdict | Requirement |
| --- | --- |
| automated | Complete supported mechanisms; operative mechanics; no unsupported/deferred families |
| noMechanics | Explicit allowed reason; no operative or unimplemented mechanisms |
| needsAnnotation | Automatically generated unresolved interpretation |
| unsupported | Identified mechanism family and reason; partial implemented mechanisms may remain |

Core scope is PHB, XPHB, DMG, XDMG for class, subclass, classFeature, subclassFeature, race, subrace, background, feat, optionalfeature, spell, item, baseitem and magicvariant. Reports must show source × kind × verdict counts and each entry's identity, layers, families and reasons. Extension books retain their own reported gaps.

The minimum core gate requires needsAnnotation = 0 with reviewed explanations for every remaining unsupported/noMechanics row. A blanket unsupported label is not an acceptable substitute for interpretation. Field presence, sidecar match, schema success, test count and spell metadata do not prove semantic coverage. One unknown mechanism prevents automated even when other mechanisms are implemented.

Combat target/hit/critical/resistance/healing settlement, effect duration/concentration and turn-trigger execution are deferred. These boundaries require visible families/reasons and reduce complete automation coverage. Ignored Foundry markers do not grant mechanics. Orphan sidecars, identity gaps, duplicate conflicts and input hash/version differences are reported separately and must not disappear from the denominator.

Every report includes its version lock. Diff reports describe additions/removals, verdict changes, migration version changes and overlay reversals. Deterministic replay must produce byte-identical outputs from the same locked inputs. Genuine missing real-data tests are skipped with the reason; they are not counted as passed.
