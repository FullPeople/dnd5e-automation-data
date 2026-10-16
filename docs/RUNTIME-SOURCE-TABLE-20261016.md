# Runtime source-table audit · 2026-10-16

The complete replay uses the same 229 verified cached inputs and Web consumer `f2275e28f9394e966a10862634ed08b098e873c4`. All 18,789 canonical identities, 4,561 reviewed records, the input URL/hash ledger and reviewed snapshot hash remain unchanged. The report binds 70 actual consumer modules, each matching its committed Git blob.

Two records gain a calculated-resource witness at level 1: XPHB Rage and XPHB Favored Enemy, each with a maximum of 2 from its declared owner class table. Their 2014 identities remain separate. All other per-record statuses and witnesses are unchanged. The observed partial-implementation count is 6,537; 522 identities are unavailable and none are unresolved. A resource witness does not certify every effect or spell-payment path of either rule.

The source-bound Rage lifecycle was additionally exercised against the actual PHB and XPHB cached class data: long-rest recovery for 2014, one use on a short rest and all uses on a long rest for 2024, plus level changes preserving spending. No publisher bodies or player records are committed.

Validation: complete corpus replay; 70-module working-byte/Git-blob verification; 8 actual-consumer positive/negative probe scenarios; 329 Vitest tests passing with 11 existing conditional skips; all Node tests; TypeScript build; 6 public-export regression tests. Runtime ledger SHA-256: `32f224c2358f233671491ee05eabb13470d20215c1b04f3876385e6f31d4556e`. Browser and real-room acceptance are tracked in the consuming Web/Suite projects.
