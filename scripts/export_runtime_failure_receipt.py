"""Retain failed replay metadata without publishing failed witness payloads."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def parsed(raw):
    try:
        return json.loads(raw) if raw is not None else None
    except (ValueError, UnicodeError, RecursionError):
        return None


def canonical_digest(value):
    return digest(json.dumps(value, sort_keys=True, ensure_ascii=True,
                             separators=(",", ":")).encode("utf-8"))


def receipt(previous_raw, files, producer=None, consumer=None):
    previous = json.loads(previous_raw)
    trusted = previous["records"]
    kinds = {r["witness"]["kind"] for r in trusted if isinstance(r.get("witness"), dict)}
    statuses = {"implemented", "manual", "unavailable", "unresolved"}
    current = parsed(files.get("report"))
    rows = current.get("records") if isinstance(current, dict) else None
    deltas, identity_mismatches = [], []
    if isinstance(rows, list):
        for index, old in enumerate(trusted):
            new = rows[index] if index < len(rows) and isinstance(rows[index], dict) else {}
            if new.get("id") != old["id"]:
                identity_mismatches.append(index)
            if new != old:
                witness = new.get("witness")
                kind = witness.get("kind") if isinstance(witness, dict) else None
                status = new.get("status")
                previous_witness = old.get("witness")
                deltas.append({"index": index, "id": old["id"],
                               "previousStatus": old["status"],
                               "currentStatus": status if isinstance(status, str) and status in statuses else "unknown",
                               "previousWitnessKind": previous_witness.get("kind") if isinstance(previous_witness, dict) else None,
                               "currentWitnessKind": kind if isinstance(kind, str) and kind in kinds else "unknown" if witness is not None else None,
                               "previousRecordDigest": canonical_digest(old),
                               "currentRecordDigest": canonical_digest(new)})
    journal = files.get("journal")
    journal_rows, valid_indices, duplicates, invalid_lines = 0, set(), [], []
    if journal:
        for number, line in enumerate(journal.splitlines()[1:], 2):
            row = parsed(line)
            index = row.get("index") if isinstance(row, dict) else None
            journal_rows += 1
            if type(index) is not int or not 0 <= index < len(trusted):
                invalid_lines.append(number)
            elif index in valid_indices:
                duplicates.append(index)
            else:
                valid_indices.add(index)
    # IDs and witness kinds come only from the committed, already public ledger.
    # Failed fields, exception messages, file paths and snapshots are never copied.
    return {"schemaVersion": 1, "failureEvidenceOnly": True, "accepted": False,
            "producer": producer if isinstance(producer, str) and re.fullmatch(r"[a-f0-9]{40}", producer) else None,
            "consumer": consumer if isinstance(consumer, str) and re.fullmatch(r"[a-f0-9]{40}", consumer) else None,
            "previousReportSha256": digest(previous_raw),
            "files": {name: {"present": raw is not None,
                              "bytes": len(raw) if raw is not None else 0,
                              "sha256": digest(raw) if raw is not None else None}
                      for name, raw in files.items() if name in {"report", "assembly", "journal"}},
            "expectedRecords": len(trusted),
            "reportJsonObject": isinstance(current, dict),
            "reportRecordCount": len(rows) if isinstance(rows, list) else None,
            "journalRows": journal_rows, "journalUniqueValidIndices": len(valid_indices),
            "duplicateIndices": duplicates, "invalidJournalLines": invalid_lines,
            "identityMismatchIndices": identity_mismatches, "recordDeltas": deltas,
            "sourceBodiesPublished": False}


def main():
    args = argparse.ArgumentParser(description=__doc__)
    for name in ("report", "assembly", "journal", "output"):
        args.add_argument("--" + name, required=True)
    options = args.parse_args()
    previous_raw = subprocess.check_output(["git", "--no-replace-objects", "cat-file", "blob",
                                            "HEAD:reports/progress/runtime-coverage.json"])
    files = {name: Path(getattr(options, name)).read_bytes()
             if Path(getattr(options, name)).is_file() else None
             for name in ("report", "assembly", "journal")}
    producer = os.environ.get("GITHUB_SHA") or subprocess.check_output(
        ["git", "rev-parse", "HEAD"], text=True).strip()
    value = receipt(previous_raw, files, producer, os.environ.get("CONSUMER_REVISION"))
    value["exporterSha256"] = digest(Path(__file__).read_bytes())
    output = Path(options.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, separators=(",", ":"))
        stream.write("\n")
    print(json.dumps({"failureEvidenceOnly": True, "accepted": False,
                      "recordDeltas": len(value["recordDeltas"]),
                      "journalRows": value["journalRows"]}))


if __name__ == "__main__":
    main()
