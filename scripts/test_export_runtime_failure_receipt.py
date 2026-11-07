import copy
import json
import unittest
from export_runtime_failure_receipt import receipt


class FailureReceiptTests(unittest.TestCase):
    def setUp(self):
        self.previous = {"records": [{"id": "kiwee:spell:phb:authored::::::::", "source": "PHB",
                                      "status": "implemented", "reviewed": True,
                                      "witness": {"kind": "ordinary-source-cast", "before": 2, "after": 1}}]}
        self.raw = json.dumps(self.previous).encode()

    def make(self, report, journal=None):
        return receipt(self.raw, {"report": json.dumps(report).encode(), "assembly": None,
                                  "journal": journal}, "a" * 40, "b" * 40)

    def test_lost_positive_uses_only_published_identity_and_safe_status(self):
        current = copy.deepcopy(self.previous)
        current["records"][0].update(status="manual", witness=None)
        value = self.make(current)
        self.assertEqual(value["recordDeltas"][0]["id"], self.previous["records"][0]["id"])
        self.assertEqual(value["recordDeltas"][0]["currentStatus"], "manual")
        self.assertFalse(value["accepted"])

    def test_private_snapshot_unknown_fields_and_malicious_identity_never_escape(self):
        secret = "PRIVATE_SOURCE_BODY_AND_PLAYER_SENTINEL"
        current = {"publisherBody": secret, "records": [{"id": secret, "status": secret,
                    "witness": {"kind": secret, "before": secret, "after": {secret: secret}}}]}
        value = self.make(current)
        self.assertNotIn(secret, json.dumps(value))
        self.assertEqual(value["identityMismatchIndices"], [0])
        self.assertEqual(value["recordDeltas"][0]["currentWitnessKind"], "unknown")

    def test_invalid_json_records_hash_without_raw_text(self):
        secret = b"PRIVATE_BROKEN_JSON_SENTINEL"
        value = receipt(self.raw, {"report": secret, "assembly": secret, "journal": None})
        self.assertFalse(value["reportJsonObject"])
        self.assertNotIn(secret.decode(), json.dumps(value))
        self.assertEqual(value["files"]["report"]["bytes"], len(secret))

    def test_partial_duplicate_and_invalid_journal_stay_visible_without_payloads(self):
        rows = [{"binding": "a" * 64}, {"index": 0, "witness": "PRIVATE_JOURNAL_SENTINEL"},
                {"index": 0}, {"index": 9}, {"index": True}]
        journal = ("\n".join(json.dumps(r) for r in rows) + "\n").encode()
        value = self.make(self.previous, journal)
        self.assertEqual(value["journalRows"], 4)
        self.assertEqual(value["journalUniqueValidIndices"], 1)
        self.assertEqual(value["duplicateIndices"], [0])
        self.assertEqual(value["invalidJournalLines"], [4, 5])
        self.assertNotIn("PRIVATE_JOURNAL_SENTINEL", json.dumps(value))

    def test_unchanged_report_is_still_not_acceptance_and_untrusted_metadata_is_omitted(self):
        value = receipt(self.raw, {"report": self.raw, "assembly": None, "journal": None,
                                  "PRIVATE_FILE_KEY": b"PRIVATE_PAYLOAD"}, "PRIVATE_PRODUCER", "PRIVATE_CONSUMER")
        self.assertEqual(value["recordDeltas"], [])
        self.assertFalse(value["accepted"])
        self.assertIsNone(value["producer"])
        self.assertIsNone(value["consumer"])
        self.assertNotIn("PRIVATE_", json.dumps(value))

    def test_unhashable_failed_status_remains_safe(self):
        for status in ([], {}, ["PRIVATE_UNHASHABLE_STATUS"]):
            current = copy.deepcopy(self.previous)
            current["records"][0]["status"] = status
            value = self.make(current)
            self.assertEqual(value["recordDeltas"][0]["currentStatus"], "unknown")
            self.assertNotIn("PRIVATE_UNHASHABLE_STATUS", json.dumps(value))
    def test_null_previous_witness_remains_safe(self):
        previous = {"records": [{"id": "published-null-witness", "status": "manual", "witness": None}]}
        value = receipt(json.dumps(previous).encode(), {"report": b'{"records":[]}'})
        self.assertIsNone(value["recordDeltas"][0]["previousWitnessKind"])


if __name__ == "__main__":
    unittest.main()
