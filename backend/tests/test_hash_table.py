import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dsa.hash_table import CustomHashTable, HashTableFullError


class TestCustomHashTable(unittest.TestCase):
    def test_insert_and_search(self):
        table = CustomHashTable(capacity=16)
        table.insert("a7K9x", "https://example.com")
        self.assertEqual(table.search("a7K9x"), "https://example.com")

    def test_search_missing_key_returns_none(self):
        table = CustomHashTable(capacity=16)
        self.assertIsNone(table.search("missing"))

    def test_update_existing_key(self):
        table = CustomHashTable(capacity=16)
        table.insert("code1", "https://first.com")
        table.insert("code1", "https://second.com")
        self.assertEqual(table.search("code1"), "https://second.com")
        self.assertEqual(len(table), 1)

    def test_delete_key(self):
        table = CustomHashTable(capacity=16)
        table.insert("code1", "https://example.com")
        deleted = table.delete("code1")
        self.assertTrue(deleted)
        self.assertIsNone(table.search("code1"))

    def test_delete_missing_key_returns_false(self):
        table = CustomHashTable(capacity=16)
        self.assertFalse(table.delete("missing"))

    def test_collision_handling_with_linear_probing(self):
        table = CustomHashTable(capacity=4)
        table.table = [None] * table.capacity
        table.insert("keyOne", "valueOne")
        table.insert("keyTwo", "valueTwo")
        table.insert("keyThree", "valueThree")
        self.assertEqual(table.search("keyOne"), "valueOne")
        self.assertEqual(table.search("keyTwo"), "valueTwo")
        self.assertEqual(table.search("keyThree"), "valueThree")

    def test_search_after_deletion_does_not_break_probe_chain(self):
        table = CustomHashTable(capacity=4)
        original_hash = table._hash
        table._hash = lambda key: 0
        table.insert("first", "valueFirst")
        table.insert("second", "valueSecond")
        table.insert("third", "valueThird")
        table.delete("first")
        self.assertIsNone(table.search("first"))
        self.assertEqual(table.search("second"), "valueSecond")
        self.assertEqual(table.search("third"), "valueThird")
        table._hash = original_hash

    def test_resize_preserves_entries(self):
        table = CustomHashTable(capacity=4)
        for index in range(10):
            table.insert(f"code{index}", f"https://example.com/{index}")
        for index in range(10):
            self.assertEqual(table.search(f"code{index}"), f"https://example.com/{index}")

    def test_get_all_entries_excludes_deleted(self):
        table = CustomHashTable(capacity=16)
        table.insert("codeA", "https://a.com")
        table.insert("codeB", "https://b.com")
        table.delete("codeA")
        entries = table.get_all_entries()
        keys = [key for key, _ in entries]
        self.assertNotIn("codeA", keys)
        self.assertIn("codeB", keys)


if __name__ == "__main__":
    unittest.main()
