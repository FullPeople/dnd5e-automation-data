# PHB2014 Weapon Master: bounded source and workflow review

Scope: one feat, not all feats or all weapon rules. The local frozen manifest has
229 inputs; this proof reads only its pinned class, feat, item and variant-rule
inputs. No source prose, upstream snapshots or player cards are committed.

## Sources and limits

- Localized Weapon Master, PHB p170: SHA256 of JSON.stringify(raw)
  `058b1e469d74445bb81c838588ef6452732d7ac1e4a3a1eefbc6d274d9d19008`.
- `data/feats.json`: `0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6`,
  retrieved at `5cc0bbe2c2b241a334e731af4448bdba2168e8bd`.
- `data/items-base.json`: `8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff`,
  retrieved at `e2623b204ddbdf2bcfa8317acfc962de89c676e2`.
- PHB Feats default repeatability entry: `75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269`.
- The feat has STR/DEX +1, four distinct simple/martial weapon kinds, no explicit
  max and no repeatability override. There is no prior-unproficient requirement.
  The cap20 interpretation comes from the pinned upstream renderer default,
  not an invented raw field or an independently retrieved WotC page.
- [Renderer cap contract](https://github.com/tjliqy/5etools-cn/blob/5cc0bbe2c2b241a334e731af4448bdba2168e8bd/js/render.js#L7093-L7123),
  git blob `fd559e0baad858c2bc59a813603a55e41972a1f4`.

## Filter translation drift and reviewed domain

The frozen fromFilter says `type=军用武器;寻常武器|miscellaneous=平凡的`.
The pinned renderer instead uses simple=`简易` and martial=`军用`, while the
item filter emits mundane=`寻常`. The literal translated filter therefore is
not evidence of a successfully executed 52-result query. This implementation
uses the separately reviewed simple/martial category and mundane semantics,
consistent with the feat's structured count and localized choice description.

- [Category mapping](https://github.com/tjliqy/5etools-cn/blob/e2623b204ddbdf2bcfa8317acfc962de89c676e2/js/parser.js#L2105-L2112):
  blob `6ff93e4c461362abe7d7c11557eb9049f00d744d`.
- [Mundane predicate](https://github.com/tjliqy/5etools-cn/blob/e2623b204ddbdf2bcfa8317acfc962de89c676e2/js/render.js#L13745):
  accepts rarity `none` and `unknown`, among its explicit basic-category cases.
  Thus the two OotA unknown-rarity weapon kinds are not excluded as magical.
- [Filter labels](https://github.com/tjliqy/5etools-cn/blob/e2623b204ddbdf2bcfa8317acfc962de89c676e2/js/filter-items.js#L398-L400):
  blob `1be153e23086198a26a441902a5b5eaa98f2a043`.

The reviewed frozen baseitem domain contains 52 exact source-qualified identities,
not the entire raw fromFilter domain:

- 37 PHB, raw edition classic, normalized edition 2014, rarity none.
- 10 DMG, raw edition classic, normalized edition 2014, rarity none. These are
  Antimatter Rifle, Automatic Pistol, Automatic Rifle, Hunting Rifle, Laser
  Pistol, Laser Rifle, Musket, Pistol, Revolver and Shotgun. All ten and only
  these ten carry firearm=true. DMG must be enabled and the player must explicitly
  record DM permission for the selected firearm training. This is a conservative
  product consent boundary, not a claim the source mandates a checkbox. The
  frozen Firearms|DMG p267 ruleType O entry has hash
  `ed8af9c501803acb562fbee219af160f47862b68f4f4bcc7009d1e69add593d0`
  and leaves firearm proficiency to the DM. Source enablement alone is not DM
  permission, and this does not enable ammunition/reload/burst-fire automation.
- ERLW Double-Bladed Scimitar, DSotDQ Hoopak and ToA Yklwa have no raw edition
  and rarity none. OotA Hooked Shortspear and Light Repeating Crossbow have no
  raw edition and rarity unknown. All five retain normalized edition `both`.
  Compatibility with the 2014 feat is bounded to these reviewed identities,
  not a rule that every `both` item is legacy. The pinned parser independently
  records OotA 2015-09-15, ToA 2017-09-19, ERLW 2019-11-19 and DSotDQ
  2022-11-22 at lines 3953, 3959, 3993 and 4035. These are upstream publication
  metadata, not a claim that the raw entries say edition 2014.

The frozen non-baseitem `items.json` also contains three category+mundane
matches. Iron Ball|IDRotF238 is a game-specific thrown ball (entry hash
`9322e62fc78a20017c92f71767cd6dc41613c6e5ced61bc61533c8d71442d3c0`).
Oversized Longbow|WDH201 is a unique weapon with STR18 and Medium-or-larger
restrictions (hash `39455108356be700b1c40c91ede7eb4924a725a0c676907a0f41bdc42b8356d4`).
Their special-item proficiency semantics are not generalized by this bounded
base-kind adapter; they remain visibly unsupported, not proven rules-illegal.
Psychic Blade|XPHB136 is a separate2024 feature weapon
(hash `5e26e335bad615b2b261a1a7c13a58c45324f962f0fadd267c350ae2fa548284`).
The audit rejects laundering these into the52 reviewed kinds.

Net is PHB149, martial/R, classic, mundane, and has no damage dice. It is a
valid proficiency target. Missing damage must not remove it from the choice
catalog; unsupported attack/damage generation must remain visible rather than
inventing damage. Reprinted XPHB items are distinct, not aliases of PHB kinds.

Magic weapons are not candidates. Actual attacks inherit only the matching
canonical baseItem name and source (localized or English), without merging
PHB and XPHB. Selecting a kind does not create an inventory item. Existing
proficiency must not add a second proficiency bonus. The audit also executes
actual `specificMagicItems` generation for all five both-edition supplement
bases using the frozen2014 +1 Weapon template, then checks their actual2014
magic attacks. `magicvariants.json` has SHA256
`4a4b0f3c8b268d8b134386f16e705df9b14d60419b2f2fa160da45b78bd4967d`
at `5cc0bbe2c2b241a334e731af4448bdba2168e8bd` (git blob
`4582735f022a2b932be9a5361e06bb281956d245`), not e2623, whose canonical
hash differs. `items.json` also comes from the5cc revision and has hash
`883f7bb4df2eb35fb37e7caa3a8765e0209014caa360d1c0358daa6f4b2da488`.
The template entry hash is
`6a3525587d78abd77aa023cbb31c372f48db99f44aa438e55326d8d5aa91aaf2`.

## License boundary

[Upstream LICENSE.md](https://github.com/tjliqy/5etools-cn/blob/e2623b204ddbdf2bcfa8317acfc962de89c676e2/LICENSE.md)
(blob `5fc90b54c6dc961c0e1fef50e567e8c081ec6f6c`) declares MIT for code and
English data-bak, and CC BY-NC-SA4.0 for localized data/. This is the upstream
repository's stated license, not independent assurance of rights in WotC
publisher text. Source summaries, hashes, identifiers and test mechanics are
retained; original rule text and raw source snapshots remain outside this repo.
The project's own license is unchanged.

## Acceptance boundary

The companion audit exercises actual normalized source data and real owned
class ASI slots through the consumer API. It checks consent, four unique kinds,
source and edition gating, ability caps, effective training and actual weapon
attacks, persistence/reopen, replacement/withdrawal, manual field protection and
hostile imported shapes. It binds committed consumer modules and the committed
producer script. Runtime eligibility checks canonical identity and reviewed
mechanical/structural shape, not cryptographic authentication of arbitrary
imported publisher prose. This is not browser certification, a full-corpus replay,
publisher-text retrieval, deployment or a claim that all weapon rules work.
