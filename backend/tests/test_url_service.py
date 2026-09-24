import os
import sys
import shutil
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.url_service import URLService, InvalidURLError, DuplicateAliasError, is_valid_url


class TestURLValidation(unittest.TestCase):
    def test_valid_http_url(self):
        self.assertTrue(is_valid_url("http://example.com"))

    def test_valid_https_url(self):
        self.assertTrue(is_valid_url("https://example.com/path?query=1"))

    def test_empty_url_is_invalid(self):
        self.assertFalse(is_valid_url(""))

    def test_none_url_is_invalid(self):
        self.assertFalse(is_valid_url(None))

    def test_missing_scheme_is_invalid(self):
        self.assertFalse(is_valid_url("example.com"))

    def test_unsupported_scheme_is_invalid(self):
        self.assertFalse(is_valid_url("ftp://example.com"))


class TestURLService(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.mkdtemp()
        self.storage_path = os.path.join(self.temporary_directory, "urls.json")
        self.patcher = patch("services.url_service.load_urls", return_value={})
        self.patcher.start()
        self.save_patcher = patch("services.url_service.save_urls")
        self.mock_save = self.save_patcher.start()
        self.service = URLService()

    def tearDown(self):
        self.patcher.stop()
        self.save_patcher.stop()
        shutil.rmtree(self.temporary_directory, ignore_errors=True)

    def test_create_short_url_returns_record(self):
        record = self.service.create_short_url("https://example.com/very/long/path")
        self.assertEqual(record["original_url"], "https://example.com/very/long/path")
        self.assertEqual(record["click_count"], 0)
        self.assertEqual(len(record["short_code"]), 6)

    def test_create_short_url_raises_on_invalid_url(self):
        with self.assertRaises(InvalidURLError):
            self.service.create_short_url("not-a-valid-url")

    def test_custom_alias_conflict_raises(self):
        self.service.create_short_url("https://example.com", custom_alias="my-project")
        with self.assertRaises(DuplicateAliasError):
            self.service.create_short_url("https://another.com", custom_alias="my-project")

    def test_get_url_returns_stored_record(self):
        record = self.service.create_short_url("https://example.com")
        fetched = self.service.get_url(record["short_code"])
        self.assertEqual(fetched["original_url"], "https://example.com")

    def test_delete_url_removes_entry(self):
        record = self.service.create_short_url("https://example.com")
        deleted = self.service.delete_url(record["short_code"])
        self.assertTrue(deleted)
        self.assertIsNone(self.service.get_url(record["short_code"]))

    def test_increment_click_count(self):
        record = self.service.create_short_url("https://example.com")
        updated = self.service.increment_click_count(record["short_code"])
        self.assertEqual(updated["click_count"], 1)
        updated_again = self.service.increment_click_count(record["short_code"])
        self.assertEqual(updated_again["click_count"], 2)

    def test_increment_click_count_missing_code_returns_none(self):
        result = self.service.increment_click_count("doesNotExist")
        self.assertIsNone(result)

    def test_get_all_urls_returns_list(self):
        self.service.create_short_url("https://example.com/one")
        self.service.create_short_url("https://example.com/two")
        all_urls = self.service.get_all_urls()
        self.assertEqual(len(all_urls), 2)


if __name__ == "__main__":
    unittest.main()
