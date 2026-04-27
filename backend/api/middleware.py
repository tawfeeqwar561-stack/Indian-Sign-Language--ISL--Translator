# Auth, CORS, etc.
"""Request middleware — rate limiting, API key validation, etc."""

import time
import logging
from functools import wraps
from collections import defaultdict
from flask import request, jsonify

logger = logging.getLogger(__name__)

# Simple in-memory rate limiter
_request_counts: dict = defaultdict(list)
RATE_LIMIT = 60          # requests
RATE_WINDOW = 60          # seconds


def rate_limit(f):
    """Decorator: limit requests per IP."""
    @wraps(f)
    def wrapped(*args, **kwargs):
        ip = request.remote_addr or 'unknown'
        now = time.time()
        _request_counts[ip] = [t for t in _request_counts[ip] if now - t < RATE_WINDOW]
        if len(_request_counts[ip]) >= RATE_LIMIT:
            return jsonify({'error': 'Rate limit exceeded'}), 429
        _request_counts[ip].append(now)
        return f(*args, **kwargs)
    return wrapped


def validate_json(required_fields: list):
    """Decorator: ensure JSON body contains required fields."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            data = request.get_json(silent=True)
            if data is None:
                return jsonify({'error': 'JSON body required'}), 400
            missing = [fld for fld in required_fields if fld not in data]
            if missing:
                return jsonify({'error': f'Missing fields: {missing}'}), 400
            return f(*args, **kwargs)
        return wrapped
    return decorator