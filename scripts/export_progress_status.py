"""Export identities and review states, never rule text or private receipts.

The input IR and accepted overlays remain authoritative. Historical private
receipts are read locally and reduced to explicit hashes and bounded QA facts.
They never qualify a different consumer commit or a production publication.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlparse

REPOSITORY = "FullPeople/dnd5e-automation-data"
CATEGORIES = {
    "values": ["race", "subrace", "sense", "variantrule"],
    "equipment": ["baseitem", "item", "itemGroup", "itemMastery", "itemProperty", "itemType", "magicvariant", "class", "classFeature", "subclass", "subclassFeature", "feat", "boon", "reward", "optionalfeature", "charoption"],
    "training": ["background", "language", "skill"],
    "spells": ["spell"],
    "resources": ["action", "condition", "disease", "psionic"],
}
BOUNDARIES = {
    "unreviewed": "整条语义尚未核对；结构解析不表示已支持，保持手动处理。",
    "no-mechanics": "已核对为无需执行机制的记录；不计入整条自动化。",
    "local-complete": "原数据快照标记整条完成；缺少与当前角色卡提交绑定的逐条验证及发布证明，当前可用待核实。",
    "partial-payload": "仅记录本地核对后的部分载荷类别；未列部分、阻碍项及真实条件仍需手动处理，历史测试不代表当前版本可用。",
    "reviewed-held": "规则已核对，执行机制仍缺失或有依赖／冲突；不启用，不补齐默认行为。",
}
IDENTITY_FIELDS = ["packId", "kind", "engName", "classSource", "classEngName", "subclassSource", "subclassEngShortName", "level", "raceSource", "raceEngName", "extra"]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_checked(descriptor):
    path = Path(descriptor["path"])
    data = path.read_bytes()
    if len(data) != descriptor["bytes"] or digest(data) != descriptor["sha256"]:
        raise ValueError("Historical evidence bytes do not match their receipt: " + path.name)
    return data


def source_names(envelope, upstream):
    names = {}
    if upstream:
        for item in envelope["versionLock"]["inputs"]:
            if item["namespace"] != "kiwee-homebrew" or item["role"] != "catalog":
                continue
            path = upstream / item["namespace"] / unquote(urlparse(item["url"]).path.lstrip("/"))
            if not path.is_file():
                continue
            data = path.read_bytes()
            if len(data) != item["bytes"] or digest(data) != item["sha256"]:
                continue
            for source in json.loads(data).get("_meta", {}).get("sources", []):
                code, name = source.get("json"), source.get("full")
                if isinstance(code, str) and isinstance(name, str) and len(name) <= 180:
                    names.setdefault(code.upper(), name)
    return names


def historical_validations(evidence, batches, consumer_root):
    index, by_batch = {}, {}
    if not evidence:
        return index, by_batch
    for path in sorted(evidence.glob("*receipt*.json")):
        receipt_data = path.read_bytes()
        receipt = json.loads(receipt_data)
        if not isinstance(receipt, dict) or not isinstance(receipt.get("actualSourceOverlay"), dict):
            continue
        overlay = receipt["actualSourceOverlay"]
        matching = [name for name, review in batches.items() if review["sha256"] == overlay.get("sha256")]
        if not matching:
            continue
        read_checked(overlay)
        native = receipt.get("nativePerNode", [])
        apps = receipt.get("actualApps", []) + receipt.get("realItemRemovalApps", [])
        if not native or not apps or len(apps) != receipt.get("browserPassed"):
            raise ValueError("Incomplete historical native/browser association: " + path.name)
        artifacts = receipt["formalArtifacts"]
        ir = next(item for item in artifacts if item["path"].endswith("/automation.json"))
        read_checked(ir)
        for descriptor in native:
            read_checked(descriptor)
        for descriptor in apps:
            app = json.loads(read_checked(descriptor))
            if not app.get("actualCompleteApp") or app.get("errors") or app.get("network"):
                raise ValueError("Historical App evidence is not a clean complete App: " + path.name)
            if app.get("candidateSHA256") != ir["sha256"]:
                raise ValueError("Historical App evidence has a different IR: " + path.name)
        for item in receipt.get("checks", []):
            if item.get("actual", {}).get("exitCode") != 0:
                raise ValueError("Historical final check did not pass: " + path.name)
        key = digest(receipt_data)
        consumer_commit = receipt["runtimeCodeCommit"]
        if not re.fullmatch(r"[0-9a-f]{40}", consumer_commit):
            if not consumer_root:
                raise ValueError("A consumer repository is required to resolve the historical code SHA")
            consumer_commit = subprocess.check_output(["git", "-C", str(consumer_root), "rev-parse", "--verify", consumer_commit + "^{commit}"], text=True).strip()
        index[key] = {
            "scope": "historical-local-snapshot",
            "sourceCommit": receipt["sourceCodeCommit"],
            "consumerCodeCommit": consumer_commit,
            "sdkProducerCommit": receipt["sdkProducerCommit"],
            "artifactSha256": ir["sha256"],
            "nativeChecksPerNode": receipt["nativeTestsEachNode"],
            "nodeRuns": len(native),
            "completeAppCases": len(apps),
            "nativeArtifactHashes": [item["sha256"] for item in native],
            "appArtifactHashes": [item["sha256"] for item in apps],
            "qualification": "partial-or-held-behaviour-only; not whole-rule/current-consumer/publication proof",
        }
        for name in matching:
            by_batch[name] = [key]
    return index, by_batch


def export_snapshot(ir, overlay_root, revision, upstream=None, evidence=None, consumer_root=None):
    raw = ir.read_bytes()
    envelope = json.loads(raw)
    reviews_data = (overlay_root / "reviews.json").read_bytes()
    reviews = json.loads(reviews_data)
    # Use the producer's exact locale ordering rather than a Python approximation.
    script = """import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
    const l=JSON.parse(readFileSync(process.argv[1])).versionLock;
    const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,c])=>[k,canonical(c)])):v;
    const input={version:l.kiweeChangelogVersion,date:l.kiweeChangelogDate,migrations:l.foundryMigrationVersion,inputs:l.inputs.filter(i=>i.namespace!=='automation-overlay').map(({namespace,path,sha256,bytes,role})=>({namespace,path,sha256,bytes,role})).sort((a,b)=>`${a.namespace}/${a.path}`.localeCompare(`${b.namespace}/${b.path}`))};
    process.stdout.write(createHash('sha256').update(JSON.stringify(canonical(input))).digest('hex'));"""
    lock = subprocess.check_output(["node", "--input-type=module", "-e", script, str(ir)], text=True)
    batches, accepted = {}, {}
    for review in reviews:
        path = review["path"]
        if not re.fullmatch(r"[A-Za-z0-9_./-]+\.json", path) or any(p in ["", ".", ".."] for p in path.split("/")):
            raise ValueError("Unsafe overlay path")
        data = (overlay_root / path).read_bytes()
        committed = subprocess.check_output(["git", "-C", str(overlay_root.parent), "show", revision + ":overlay/" + path])
        if committed != data:
            raise ValueError("Overlay bytes are not in the declared source revision")
        rows = json.loads(data)
        samples = review["sampleKeys"]
        if digest(data) != review["sha256"] or review["inputLock"] != lock or review["decision"] != "accepted" or review["mechanicErrors"] != 0 or not 1 <= len(rows) <= 50 or len(set(samples)) != min(10, len(rows)):
            raise ValueError("Stale or invalid accepted overlay batch: " + review["batch"])
        keys = {row["identity"]["key"] for row in rows}
        if not set(samples) <= keys or len(keys) != len(rows):
            raise ValueError("Invalid review sample identities")
        batches[review["batch"]] = {"path": "overlay/" + path, "sha256": review["sha256"], "reviewedAt": review["reviewedAt"]}
        for offset, row in enumerate(rows):
            key = row["identity"]["key"]
            if key in accepted or row["batch"] != review["batch"]:
                raise ValueError("Duplicate or mismatched accepted rule")
            accepted[key] = (row, review["batch"], "overlay/" + path + "#" + str(offset))
    validations, by_batch = historical_validations(evidence, batches, consumer_root)
    names = source_names(envelope, upstream)
    kinds = {kind: category for category, members in CATEGORIES.items() for kind in members}
    records, sources, seen = [], {}, set()
    for row in envelope["records"]:
        identity, verdict = row["identity"], row["verdict"]
        key, source = identity["key"], identity["source"]
        if key in seen or identity["kind"] not in kinds or verdict not in ["automated", "noMechanics", "unsupported", "needsAnnotation"]:
            raise ValueError("Duplicate identity or unknown record kind/verdict")
        seen.add(key)
        reviewed = key in accepted
        if reviewed != (verdict != "needsAnnotation"):
            raise ValueError("Review state has no matching accepted overlay")
        batch = None
        if reviewed:
            overlay, batch, ref = accepted[key]
            if overlay["verdict"] != verdict or overlay["identity"] != identity or not any(p["layer"] == "overlay" and p["ref"] == ref for p in row["provenance"]):
                raise ValueError("IR differs from its accepted review identity/verdict")
            if overlay.get("mechanics", {}) != row.get("mechanics", {}) or overlay["unsupported"] != row["unsupported"]:
                raise ValueError("IR payload/gaps differ from accepted overlay")
        families = sorted(k for k, value in row.get("mechanics", {}).items() if value and reviewed)
        boundary = "unreviewed" if not reviewed else "no-mechanics" if verdict == "noMechanics" else "local-complete" if verdict == "automated" else "partial-payload" if families else "reviewed-held"
        public_identity = {k: identity[k] for k in IDENTITY_FIELDS if k in identity}
        public_identity["edition"] = row.get("edition")
        origin = "third-party" if identity["packId"] == "kiwee-homebrew" else "project" if source.startswith("LOCAL-") else "official"
        if source in sources and sources[source]["origin"] != origin:
            raise ValueError("Conflicting source namespaces need an explicit display mapping")
        sources[source] = {"id": source, "name": names.get(source.upper(), source), "origin": origin}
        records.append({
            "id": key, "source": source, "category": kinds[identity["kind"]],
            "reviewed": reviewed, "complete": verdict == "automated", "tests": [],
            "identity": public_identity, "verdict": verdict,
            "payloadFamilies": families,
            "gapFamilies": sorted({gap["family"] for gap in row["unsupported"]}),
            "gapCodes": sorted({gap["code"] for gap in row["unsupported"]}),
            "boundary": boundary, "reviewRef": batch,
            "validationRefs": by_batch.get(batch, []),
        })
    if set(accepted) != {row["id"] for row in records if row["reviewed"]}:
        raise ValueError("Accepted reviews contain identities missing from the actual IR")
    return {
        "schemaVersion": 2, "scope": "local-snapshot",
        "updatedAt": max(review["reviewedAt"] for review in reviews) + "T00:00:00Z",
        "authority": {"repository": REPOSITORY, "sourceRevision": revision,
                      "irSha256": digest(raw), "irBytes": len(raw), "reviewsSha256": digest(reviews_data),
                      "inputLock": lock, "upstreamVersion": envelope["versionLock"]["kiweeChangelogVersion"]},
        "boundaries": BOUNDARIES, "reviews": batches, "validations": validations,
        "sources": [sources[key] for key in sorted(sources)], "records": records,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ir", type=Path, required=True)
    parser.add_argument("--overlay-root", type=Path, required=True)
    parser.add_argument("--source-revision", required=True)
    parser.add_argument("--upstream-root", type=Path)
    parser.add_argument("--evidence-root", type=Path)
    parser.add_argument("--consumer-repository-root", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.source_revision):
        parser.error("--source-revision requires a full commit SHA")
    result = export_snapshot(args.ir, args.overlay_root, args.source_revision, args.upstream_root, args.evidence_root, args.consumer_repository_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    # One compact row per line: reviewable diff without a multi-megabyte single line.
    header = {k: v for k, v in result.items() if k != "records"}
    content = json.dumps(header, ensure_ascii=False, separators=(",", ":"))[:-1] + ',"records":[\n'
    content += ",\n".join(json.dumps(row, ensure_ascii=False, separators=(",", ":")) for row in result["records"]) + "\n]}\n"
    # Exclusive immutable output; never truncate a shared historical inode.
    with args.output.open("x", encoding="utf-8", newline="\n") as output:
        output.write(content)
    print(json.dumps({"records": len(result["records"]), "reviewed": sum(r["reviewed"] for r in result["records"]), "localMarkedComplete": sum(r["complete"] for r in result["records"]), "historicalValidationReceipts": len(result["validations"]), "sha256": digest(content.encode()), "bytes": len(content.encode())}))


if __name__ == "__main__":
    main()
