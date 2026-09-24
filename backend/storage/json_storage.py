import json
import os
import threading

STORAGE_LOCK = threading.Lock()


def get_storage_path():
    current_directory = os.path.dirname(os.path.abspath(__file__))
    backend_directory = os.path.dirname(current_directory)
    project_root = os.path.dirname(backend_directory)
    data_directory = os.path.join(project_root, "data")
    os.makedirs(data_directory, exist_ok=True)
    return os.path.join(data_directory, "urls.json")


def load_urls():
    storage_path = get_storage_path()
    if not os.path.exists(storage_path):
        return {}

    with STORAGE_LOCK:
        try:
            with open(storage_path, "r", encoding="utf-8") as storage_file:
                content = storage_file.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except (json.JSONDecodeError, OSError):
            return {}


def save_urls(url_records):
    storage_path = get_storage_path()
    with STORAGE_LOCK:
        temporary_path = storage_path + ".tmp"
        with open(temporary_path, "w", encoding="utf-8") as storage_file:
            json.dump(url_records, storage_file, indent=2)
        os.replace(temporary_path, storage_path)
