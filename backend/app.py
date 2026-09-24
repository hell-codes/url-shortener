from flask import Flask
from flask_cors import CORS

from routes.url_routes import url_blueprint
from middleware.error_handler import register_error_handlers


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.register_blueprint(url_blueprint)
    register_error_handlers(app)
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
