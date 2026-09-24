from flask import Blueprint, jsonify, request, redirect

from services.url_service import (
    url_service,
    DuplicateAliasError,
    InvalidURLError,
)
from dsa.hash_table import HashTableFullError

url_blueprint = Blueprint("url_blueprint", __name__)


def build_short_url(short_code):
    base_url = request.host_url.rstrip("/")
    return f"{base_url}/{short_code}"


@url_blueprint.route("/api/shorten", methods=["POST"])
def shorten_url():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"success": False, "error": "Request body must be valid JSON"}), 400

    original_url = payload.get("url")
    custom_alias = payload.get("alias")

    try:
        record = url_service.create_short_url(original_url, custom_alias)
    except InvalidURLError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except DuplicateAliasError as error:
        return jsonify({"success": False, "error": str(error)}), 409
    except HashTableFullError as error:
        return jsonify({"success": False, "error": str(error)}), 507

    response_body = {
        "success": True,
        "short_code": record["short_code"],
        "short_url": build_short_url(record["short_code"]),
        "original_url": record["original_url"],
        "created_at": record["created_at"],
        "click_count": record["click_count"],
    }
    return jsonify(response_body), 201


@url_blueprint.route("/api/urls", methods=["GET"])
def list_urls():
    records = url_service.get_all_urls()
    enriched_records = []
    for record in records:
        enriched_records.append(
            {
                "short_code": record["short_code"],
                "short_url": build_short_url(record["short_code"]),
                "original_url": record["original_url"],
                "created_at": record["created_at"],
                "click_count": record["click_count"],
            }
        )
    return jsonify({"success": True, "urls": enriched_records}), 200


@url_blueprint.route("/api/urls/<short_code>", methods=["GET"])
def get_url_details(short_code):
    record = url_service.get_url(short_code)
    if record is None:
        return jsonify({"success": False, "error": "Short code not found"}), 404

    response_body = {
        "success": True,
        "short_code": record["short_code"],
        "short_url": build_short_url(record["short_code"]),
        "original_url": record["original_url"],
        "created_at": record["created_at"],
        "click_count": record["click_count"],
    }
    return jsonify(response_body), 200


@url_blueprint.route("/api/urls/<short_code>", methods=["DELETE"])
def delete_url(short_code):
    deleted = url_service.delete_url(short_code)
    if not deleted:
        return jsonify({"success": False, "error": "Short code not found"}), 404
    return jsonify({"success": True, "short_code": short_code}), 200


@url_blueprint.route("/api/hashtable/snapshot", methods=["GET"])
def hashtable_snapshot():
    snapshot = url_service.get_slot_snapshot()
    return jsonify({"success": True, "capacity": url_service.hash_table.capacity, "size": url_service.hash_table.size, "slots": snapshot}), 200


@url_blueprint.route("/<short_code>", methods=["GET"])
def redirect_to_original(short_code):
    record = url_service.increment_click_count(short_code)
    if record is None:
        return jsonify({"success": False, "error": "Short link not found"}), 404
    return redirect(record["original_url"], code=302)
