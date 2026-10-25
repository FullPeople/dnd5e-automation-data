# PHB2014 armor feats: bounded source and workflow review

This batch is separate from the previous Tough/Resilient delivery. It reviews only Lightly Armored, Moderately Armored and Heavily Armored acquired through authenticated legacy class ASI alternatives. It neither marks the entire corpus complete nor proves a published release.

## Canonical source identity

The local frozen manifest is required by `scripts/audit_reviewed_armor_feats.ts`. No raw publisher prose or private character snapshots are included in this repository.

- `feats.json`: canonical JSON SHA-256 `0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6`; upstream retrieval revision `5cc0bbe2c2b241a334e731af4448bdba2168e8bd`.
- `variantrules.json`: canonical JSON SHA-256 `21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44`; retrieval revision `e2623b204ddbdf2bcfa8317acfc962de89c676e2`.
- PHB Feats p165: entry SHA-256 `75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269`. This is the supporting source for default nonrepeatability, prerequisites at acquisition, and suspension until a lost prerequisite is restored.
- Thirteen original PHB/TCE class files and their 68 owned ASI slots are independently rechecked against existing `legacyAsiEvidence.json`; actual PHB equipment comes from frozen `items-base.json`, SHA-256 `8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff` at revision `e2623b204ddbdf2bcfa8317acfc962de89c676e2`.

| PHB identity | Entry SHA-256 | Original mechanical fields |
| --- | --- | --- |
| Lightly Armored p167, feat[163] | `5e87f09b022c56e00d9283ce52708ee38059e7349d815443d3bb2c5da5a41a42` | One point in Strength or Dexterity; light armor; no prerequisite |
| Moderately Armored p168, feat[196] | `98b557e88aeeb29328dddf9924ddce14a695945979de06cd766ed7cb119708fa` | One point in Strength or Dexterity; medium armor and shield; requires light armor proficiency |
| Heavily Armored p167, feat[146] | `5a822e4ac8cba9147dfa9b28f0a6a5ccf80dcd4f30c047e879af62c4ec15d297` | One point in Strength only; heavy armor; requires medium armor proficiency |

All three lack a repeatable override. The exact PHB identities must not be replaced by XPHB versions: notably 2014 Lightly grants no shield, 2014 Moderately grants shield, and 2014 Heavily offers no Constitution choice.

## Ability cap evidence is a data-format contract

The frozen feat bodies put their ability increase in `ability`; they do not contain a `max` field or a duplicate cap statement in their `entries`. The cap must not be described as an extracted raw field.

The same pinned upstream revision contains `Renderer.feat._mergeAbilityIncrease_getText` in [js/render.js lines 7093–7123](https://github.com/tjliqy/5etools-cn/blob/5cc0bbe2c2b241a334e731af4448bdba2168e8bd/js/render.js#L7093-L7123), Git blob `fd559e0baad858c2bc59a813603a55e41972a1f4`. Its omitted-max default is 20 and both the fixed-ability and `choose.from` branches use that maximum. This independently supports interpreting these three frozen objects with cap20. The source code itself is not copied here.

Official D&D Beyond legacy feat links were checked, but redirected to a storefront; this review does not claim independently retrieving their full WotC feat prose. The public 2014 Basic Rules ability page is background only, not a substitute for feat-specific evidence.

## Actual consumer proof and boundaries

The script bundles actual committed consumer APIs. It rejects dirty tracked, staged, untracked and ignored `src` files, validates frozen paths and input hashes, verifies its own committed script bytes, and records producer revision, consumer revision/source tree and every bundled module hash. It validates exact reviewed evidence and canonical mechanical shapes before executing any scenario.

Coverage includes 204 real class-source acquisition paths (68 slots × 3 feats), explicit confirmation, permissible and impermissible ability choices, cap20 and shared ASI order, prerequisite chains, inactive/future/self grants, empty and nonempty authored training overrides, withdrawal/replacement, source and level loss/restoration, forged/duplicate/future records, native and linked offline reopen, real armor warnings and resource preservation. These are workflow scenarios, not a count of completed rules.

2014 armor training does not itself grant AC. In particular, shield training does not add an extra +2 beyond an equipped shield. General casting restrictions, disadvantage, heavy-armor Strength/speed, equip lifecycle, old-client compatibility, real browser storage, full 18,789-rule replay, deployment and release availability require separate evidence. A successful source/API run is not a browser or publication certificate.


## Cross-edition compatibility correction

The broad English-name denial originally also suppressed genuine XPHB armor training. A read-only diagnostic against the previous `22501964` source tree (`b8f8108fe4d46a6a9d3642ab78611eba2ce9edba`) confirmed that lawful level4 Wizard, Bard and Cleric cards previously retained the three XPHB training effects. This is a compatibility correction, not three newly implemented full XPHB feats.

The same frozen `feats.json` contains these separate exact identities:

- Lightly Armored p205, XPHB feat[164], SHA-256 `423fb6efa58add6c891b114c273e96e135977ab6f06d9db8daa7c70d2a6a10d9`: level4, Strength/Dexterity identity shape, light and shield training.
- Moderately Armored p205, XPHB feat[197], SHA-256 `b86f5aeef2bc39ce9b9d03e863b8d4fd10097b6273b9afbf37e62e1954ed1c35`: level4 and light prerequisite, Strength/Dexterity shape, medium training only.
- Heavily Armored p204, XPHB feat[147], SHA-256 `6ef86668d2f7d2d91d829769f34758fbecb3e52b0487445378ce595524b569af`: level4 and medium prerequisite, Constitution/Strength shape, heavy training.

All are category G, with the canonical XPHB named-entry structure and no PHB reprint metadata. These fields distinguish them from PHB entries merely relabeled with a new source or edition. The compatibility resolver requires the exact supported source, identity, category, page, ability/prerequisite/training structures and an allowed field set. It does not permit generic execution of the ability fields.

The acquisition boundaries are deliberately different: Lightly already supported real Wizard ASI4 selection and materialization; Moderately and Heavily already refused typed acquisition because that prerequisite path was not supported. They retain training only for existing lawful level4 cards, without silently claiming a new typed acquisition flow. Exact XPHB Tough and Resilient remain separate from PHB explicit-intent adapters. An illegal level1 probe is not restored as lawful acquisition evidence.

The expanded source audit keeps its 204 PHB source-slot cases distinct from compatibility and adversarial-import cases. The older `bea1ba26` receipts remain historical evidence for that exact source and must never be relabeled as proof of this correction.
