"""Logging configuration for the application."""

import logging
import sys
from logging.handlers import RotatingFileHandler


def setup_logger(app):
    """Attach file and stream handlers to the Flask app logger."""
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'))
    log_file = app.config.get('LOG_FILE', 'isl_system.log')

    fmt = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')

    fh = RotatingFileHandler(log_file, maxBytes=10_000_000, backupCount=5)
    fh.setLevel(log_level)
    fh.setFormatter(fmt)

    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(log_level)
    sh.setFormatter(fmt)

    app.logger.addHandler(fh)
    app.logger.addHandler(sh)
    app.logger.setLevel(log_level)
    logging.getLogger().setLevel(logging.WARNING)