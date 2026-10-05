"""Original fixtures for public export safety and source binding."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from export_progress_status import export_snapshot


class PublicProgressExport(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.overlay = self.root / "overlay"
        self.overlay.mkdir()
        self.ir = self.root / "automation.json"
        lock = {"kiweeChangelogVersion": "authored", "kiweeChangelogDate": "2026-10-05", "foundryMigrationVersion": [], "inputs": []}
        lock_body = {"version": "authored", "date": "2026-10-05", "migrations": [], "inputs": []}
        fingerprint = hashlib.sha256(json.dumps(lock_body, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        self.rows = []
        for index, verdict in enumerate(["automated", "unsupported", "noMechanics", "needsAnnotation"]):
            identity = {"key": f"kiwee:item:authored:probe{index}::::::::", "packId": "kiwee", "kind": "item", "source": "AUTHORED", "engName": f"Original probe {index}", "extra": "Original identity discriminator"}
            row = {"identity": identity, "verdict": verdict, "unsupported": [{"family": "world", "code": "target-not-supported"}] if verdict == "unsupported" else [], "provenance": [], "mechanics": {"equipmentModel": {"authored": True}}, "notes": "PRIVATE_SENTINEL", "entries": ["PRIVATE_SENTINEL"]}
            if verdict != "needsAnnotation":
                row["provenance"] = [{"layer": "overlay", "ref": f"overlay/authored.json#{index}"}]
            self.rows.append(row)
        self.annotation = [{**copy.deepcopy(r), "batch": "authored"} for r in self.rows[:3]]
        data = json.dumps(self.annotation).encode()
        (self.overlay / "authored.json").write_bytes(data)
        self.reviews = [{"batch": "authored", "path": "authored.json", "sha256": hashlib.sha256(data).hexdigest(), "inputLock": fingerprint, "decision": "accepted", "mechanicErrors": 0, "reviewedAt": "2026-10-05", "sampleKeys": [r["identity"]["key"] for r in self.annotation]}]
        self.write_reviews()
        self.ir.write_text(json.dumps({"versionLock": lock, "records": self.rows}))
        self.git("init", "-q")
        self.git("config", "user.name", "Original fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        self.git("add", "overlay")
        self.git("commit", "-qm", "Original review fixture")
        self.revision = self.git("rev-parse", "HEAD").strip()

    def tearDown(self):
        self.temp.cleanup()

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root, text=True)

    def write_reviews(self):
        (self.overlay / "reviews.json").write_text(json.dumps(self.reviews))

    def export(self):
        return export_snapshot(self.ir, self.overlay, self.revision)

    def test_preserves_full_identity_unknown_edition_and_partial_gaps_without_private_text(self):
        result = self.export()
        rows = result["records"]
        self.assertEqual([r["reviewed"] for r in rows], [True, True, True, False])
        self.assertEqual([r["complete"] for r in rows], [True, False, False, False])
        self.assertIsNone(rows[0]["identity"]["edition"])
        self.assertEqual(rows[0]["identity"]["extra"], "Original identity discriminator")
        self.assertEqual(rows[1]["boundary"], "partial-payload")
        self.assertEqual(rows[1]["gapCodes"], ["target-not-supported"])
        self.assertEqual(rows[3]["payloadFamilies"], [])
        self.assertTrue(all(r["tests"] == [] and r["validationRefs"] == [] for r in rows))
        self.assertNotIn("PRIVATE_SENTINEL", json.dumps(result))

    def test_rejects_overlay_bytes_not_in_declared_commit_even_if_receipt_is_rehashed(self):
        self.annotation[0]["mechanics"]["equipmentModel"]["authored"] = False
        data = json.dumps(self.annotation).encode()
        (self.overlay / "authored.json").write_bytes(data)
        self.reviews[0]["sha256"] = hashlib.sha256(data).hexdigest()
        self.write_reviews()
        with self.assertRaisesRegex(ValueError, "declared source revision"):
            self.export()

    def test_rejects_stale_input_lock_and_invalid_main_review(self):
        self.reviews[0]["inputLock"] = "0" * 64
        self.write_reviews()
        with self.assertRaisesRegex(ValueError, "Stale or invalid"):
            self.export()

    def test_rejects_replacing_source_verdict_or_partial_payload_in_the_ir(self):
        self.rows[1]["mechanics"]["equipmentModel"]["authored"] = False
        value = json.loads(self.ir.read_text())
        value["records"] = self.rows
        self.ir.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, "payload/gaps differ"):
            self.export()

    def test_rejects_duplicate_or_missing_reviewed_rule_identities(self):
        value = json.loads(self.ir.read_text())
        value["records"].append(value["records"][0])
        self.ir.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, "Duplicate identity"):
            self.export()

    def test_cli_reports_hash_and_size_of_actual_cross_platform_output(self):
        output = self.root / "public-status.json"
        report = json.loads(subprocess.check_output([
            sys.executable, "-B", str(Path(__file__).with_name("export_progress_status.py")),
            "--ir", str(self.ir), "--overlay-root", str(self.overlay),
            "--source-revision", self.revision, "--output", str(output),
        ], text=True))
        data = output.read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(), report["sha256"])
        self.assertEqual(len(data), report["bytes"])
        self.assertNotIn(b"\r\n", data)
        self.assertEqual(len(json.loads(data)["records"]), 4)


if __name__ == "__main__":
    unittest.main()
