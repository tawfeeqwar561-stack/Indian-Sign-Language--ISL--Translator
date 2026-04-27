# Database setup
"""Database initialisation."""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db():
    """Create all tables."""
    from database.models_db import (ConversationLog, UserProfile,
                                     TranslationRecord, FederatedModelVersion,
                                     EmergencyEvent)
    db.create_all()