from flask import jsonify


def register_error_handlers(app):
    @app.errorhandler(400)
    def handle_bad_request(error):
        return jsonify({"success": False, "error": "Malformed request"}), 400

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({"success": False, "error": "Resource not found"}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        return jsonify({"success": False, "error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def handle_internal_error(error):
        return jsonify({"success": False, "error": "Internal server error"}), 500
