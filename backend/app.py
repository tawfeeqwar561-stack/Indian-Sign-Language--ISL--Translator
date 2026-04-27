"""
Main Flask application entry point.
Creates the app, initialises extensions, registers routes and WebSocket
handlers, and starts the server.
"""

import os
import sys
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

from config import get_config
from database.db import db, init_db
from api.routes import api_bp
from api.websocket_handler import register_websocket_handlers
from utils.logger import setup_logger

socketio = SocketIO()


def create_app(config_class=None):
    """Application factory."""
    app = Flask(__name__)

    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)

    setup_logger(app)

    # Allow all origins for both API and socket.io
    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)

    # Root route so localhost:5000 doesn't 404
    @app.route('/')
    def index():
        return jsonify({
            'name': 'ISL Translation System API',
            'status': 'running',
            'docs': {
                'health': '/api/health',
                'translate': '/api/translate/frame',
                'vocabulary': '/api/vocabulary',
                'dataset_videos': '/api/dataset/<label>/<filename>'
            },
            'frontend': 'http://localhost:3000',
        })

    @app.route('/api/dataset/<label>/<filename>')
    def serve_dataset_video(label, filename):
        dataset_dir = os.path.join(os.getcwd(), 'ml_pipeline', 'dataset', label)
        from flask import send_from_directory
        return send_from_directory(dataset_dir, filename)

    # ── PDF Resource Routes ──────────────────────────────────────
    RESOURCES_DIR = os.path.join(os.path.dirname(__file__), 'resources', 'pdfs')

    @app.route('/api/resources/generate', methods=['POST'])
    def generate_pdfs():
        """Generate all ISL learning PDF resources."""
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "generate_pdfs",
                os.path.join(os.path.dirname(__file__), "generate_pdfs.py"),
            )
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return jsonify({'status': 'ok', 'message': 'All PDFs generated successfully'})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/api/resources/pdfs')
    def list_pdfs():
        """List all available PDF resources."""
        os.makedirs(RESOURCES_DIR, exist_ok=True)
        files = []
        for f in sorted(os.listdir(RESOURCES_DIR)):
            if f.endswith('.pdf'):
                path = os.path.join(RESOURCES_DIR, f)
                files.append({
                    'filename': f,
                    'size': os.path.getsize(path),
                    'url': f'/api/resources/pdfs/{f}',
                })
        return jsonify(files)

    @app.route('/api/resources/pdfs/<filename>')
    def serve_pdf(filename):
        """Download a specific PDF resource."""
        from flask import send_from_directory, abort
        os.makedirs(RESOURCES_DIR, exist_ok=True)
        safe = os.path.basename(filename)
        if not safe.endswith('.pdf'):
            abort(400)
        return send_from_directory(
            RESOURCES_DIR, safe,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=safe,
        )

    # Use 'threading' on Windows for compatibility (eventlet has issues)
    async_mode = 'threading'
    socketio.init_app(app, cors_allowed_origins="*", async_mode=async_mode)

    os.makedirs(app.config.get('MODEL_DIR', 'saved_models'), exist_ok=True)
    os.makedirs(app.config.get('TTS_CACHE_DIR', 'saved_models/tts_cache'), exist_ok=True)

    app.register_blueprint(api_bp, url_prefix='/api')
    register_websocket_handlers(socketio, app)

    with app.app_context():
        init_db()

    from models import model_manager
    with app.app_context():
        try:
            model_manager.initialize(app.config)
        except Exception as e:
            app.logger.error(f"Model initialization failed: {e}")
            app.logger.warning("Running in DEMO mode — all models stubbed")

    app.logger.info("ISL Translation System started")
    return app


app = create_app()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0',
                 port=int(os.getenv('PORT', 5000)),
                 debug=app.config['DEBUG'],
                 use_reloader=False,
                 allow_unsafe_werkzeug=True)