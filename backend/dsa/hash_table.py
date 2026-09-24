class HashTableFullError(Exception):
    pass


class CustomHashTable:
    def __init__(self, capacity=16):
        self.capacity = capacity
        self.size = 0
        self.table = [None] * self.capacity
        self.load_factor_threshold = 0.7

    def _hash(self, key):
        hash_value = 0
        prime = 31
        for character in str(key):
            hash_value = (hash_value * prime + ord(character)) % self.capacity
        return hash_value

    def _probe_sequence(self, key):
        start_index = self._hash(key)
        for offset in range(self.capacity):
            yield (start_index + offset) % self.capacity

    def insert(self, key, value):
        if self.size >= self.capacity * self.load_factor_threshold:
            self._resize(self.capacity * 2)

        first_available_index = None
        for index in self._probe_sequence(key):
            slot = self.table[index]

            if slot is None:
                target_index = first_available_index if first_available_index is not None else index
                self.table[target_index] = {
                    "key": key,
                    "value": value,
                    "is_deleted": False,
                }
                self.size += 1
                return True

            if slot["is_deleted"] and first_available_index is None:
                first_available_index = index
                continue

            if (not slot["is_deleted"]) and slot["key"] == key:
                slot["value"] = value
                return True

        if first_available_index is not None:
            self.table[first_available_index] = {
                "key": key,
                "value": value,
                "is_deleted": False,
            }
            self.size += 1
            return True

        raise HashTableFullError("Hash table is full and cannot accept new entries")

    def search(self, key):
        for index in self._probe_sequence(key):
            slot = self.table[index]

            if slot is None:
                return None

            if (not slot["is_deleted"]) and slot["key"] == key:
                return slot["value"]

        return None

    def contains(self, key):
        return self.search(key) is not None

    def delete(self, key):
        for index in self._probe_sequence(key):
            slot = self.table[index]

            if slot is None:
                return False

            if (not slot["is_deleted"]) and slot["key"] == key:
                slot["is_deleted"] = True
                self.size -= 1
                return True

        return False

    def _resize(self, new_capacity):
        old_entries = self.get_all_entries()
        self.capacity = new_capacity
        self.table = [None] * self.capacity
        self.size = 0
        for key, value in old_entries:
            self.insert(key, value)

    def get_all_entries(self):
        entries = []
        for slot in self.table:
            if slot is not None and not slot["is_deleted"]:
                entries.append((slot["key"], slot["value"]))
        return entries

    def get_slot_snapshot(self):
        snapshot = []
        for index, slot in enumerate(self.table):
            if slot is None:
                snapshot.append({"index": index, "status": "empty"})
            elif slot["is_deleted"]:
                snapshot.append({"index": index, "status": "deleted", "key": slot["key"]})
            else:
                snapshot.append({"index": index, "status": "occupied", "key": slot["key"]})
        return snapshot

    def __len__(self):
        return self.size
