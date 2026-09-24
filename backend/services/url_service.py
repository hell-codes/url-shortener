import random
import string
from datetime import datetime, timezone
from urllib.parse import urlparse

from dsa.hash_table import CustomHashTable, HashTableFullError
from storage.json_storage import load_urls, save_urls

SHORT_CODE_ALPHABET = string.ascii_letters + string.digits
SHORT_CODE_LENGTH = 6
MAX_GENERATION_ATTEMPTS = 20


class DuplicateAliasError(Exception):
    pass


class InvalidURLError(Exception):
    pass


def is_valid_url(candidate_url):
    if not candidate_url or not isinstance(candidate_url, str):
        return False

    candidate_url = candidate_url.strip()
    if len(candidate_url) == 0 or len(candidate_url) > 2048:
        return False

    try:
        parsed = urlparse(candidate_url)
    except ValueError:
        return False

    if parsed.scheme not in ("http", "https"):
        return False

    if not parsed.netloc:
        return False

    return True


def generate_short_code():
    return "".join(random.choice(SHORT_CODE_ALPHABET) for _ in range(SHORT_CODE_LENGTH))


class URLService:
    def __init__(self):
        self.hash_table = CustomHashTable(capacity=64)
        self._load_existing_records()

    def _load_existing_records(self):
        stored_records = load_urls()
        for short_code, record in stored_records.items():
            self.hash_table.insert(short_code, record)

    def _persist(self):
        all_entries = self.hash_table.get_all_entries()
        records_by_code = {short_code: record for short_code, record in all_entries}
        save_urls(records_by_code)

    def create_short_url(self, original_url, custom_alias=None):
        if not is_valid_url(original_url):
            raise InvalidURLError("The provided URL is not valid")

        original_url = original_url.strip()

        if custom_alias:
            custom_alias = custom_alias.strip()
            if self.hash_table.search(custom_alias) is not None:
                raise DuplicateAliasError("This custom alias is already taken")
            short_code = custom_alias
        else:
            short_code = generate_short_code()
            attempts = 0
            while self.hash_table.search(short_code) is not None:
                attempts += 1
                if attempts >= MAX_GENERATION_ATTEMPTS:
                    raise HashTableFullError("Unable to generate a unique short code")
                short_code = generate_short_code()

        created_at = datetime.now(timezone.utc).isoformat()
        record = {
            "short_code": short_code,
            "original_url": original_url,
            "created_at": created_at,
            "click_count": 0,
        }

        self.hash_table.insert(short_code, record)
        self._persist()
        return record

    def get_url(self, short_code):
        return self.hash_table.search(short_code)

    def get_all_urls(self):
        all_entries = self.hash_table.get_all_entries()
        records = [record for _, record in all_entries]
        records.sort(key=lambda record: record["created_at"], reverse=True)
        return records

    def delete_url(self, short_code):
        deleted = self.hash_table.delete(short_code)
        if deleted:
            self._persist()
        return deleted

    def increment_click_count(self, short_code):
        record = self.hash_table.search(short_code)
        if record is None:
            return None
        record["click_count"] += 1
        self.hash_table.insert(short_code, record)
        self._persist()
        return record

    def get_slot_snapshot(self):
        return self.hash_table.get_slot_snapshot()


url_service = URLService()
