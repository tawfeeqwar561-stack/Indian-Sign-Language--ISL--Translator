# Database models
"""SQLAlchemy ORM models."""

import json
from datetime import datetime
from database.db import db


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(64), unique=True, nullable=False)
    display_name = db.Column(db.String(128))
    preferred_language = db.Column(db.String(5), default='en')
    signing_speed = db.Column(db.String(20), default='normal')
    region = db.Column(db.String(64))
    age_group = db.Column(db.String(20))
    custom_model_version = db.Column(db.String(32))
    settings_json = db.Column(db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = db.relationship('ConversationLog', backref='user', lazy='dynamic')

    @property
    def settings(self):
        return json.loads(self.settings_json or '{}')

    @settings.setter
    def settings(self, v):
        self.settings_json = json.dumps(v)

    def to_dict(self):
        return {'user_id': self.user_id, 'display_name': self.display_name,
                'preferred_language': self.preferred_language,
                'signing_speed': self.signing_speed, 'region': self.region,
                'age_group': self.age_group}


class ConversationLog(db.Model):
    __tablename__ = 'conversation_logs'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), nullable=False, index=True)
    user_id = db.Column(db.String(64), db.ForeignKey('user_profiles.user_id'))
    direction = db.Column(db.String(20), nullable=False)

    recognized_sign = db.Column(db.String(256))
    gesture_confidence = db.Column(db.Float)
    detected_emotion = db.Column(db.String(32))
    emotion_confidence = db.Column(db.Float)

    translated_text_en = db.Column(db.Text)
    translated_text_ta = db.Column(db.Text)
    translated_text_hi = db.Column(db.Text)

    input_text = db.Column(db.Text)
    input_language = db.Column(db.String(5))

    is_emergency = db.Column(db.Boolean, default=False)
    was_disambiguated = db.Column(db.Boolean, default=False)
    disambiguation_options = db.Column(db.Text)
    user_selected_option = db.Column(db.String(256))

    pipeline_latency_ms = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id, 'session_id': self.session_id,
            'direction': self.direction,
            'recognized_sign': self.recognized_sign,
            'gesture_confidence': self.gesture_confidence,
            'detected_emotion': self.detected_emotion,
            'emotion_confidence': self.emotion_confidence,
            'translated_text': {
                'en': self.translated_text_en,
                'ta': self.translated_text_ta,
                'hi': self.translated_text_hi,
            },
            'is_emergency': self.is_emergency,
            'was_disambiguated': self.was_disambiguated,
            'pipeline_latency_ms': self.pipeline_latency_ms,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }


class TranslationRecord(db.Model):
    __tablename__ = 'translation_records'

    id = db.Column(db.Integer, primary_key=True)
    sign_gloss = db.Column(db.String(128), nullable=False, index=True)
    emotion = db.Column(db.String(32), default='neutral')
    text_en = db.Column(db.Text, nullable=False)
    text_ta = db.Column(db.Text)
    text_hi = db.Column(db.Text)
    text_en_emotional = db.Column(db.Text)
    text_ta_emotional = db.Column(db.Text)
    text_hi_emotional = db.Column(db.Text)
    is_emergency = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class FederatedModelVersion(db.Model):
    __tablename__ = 'federated_model_versions'

    id = db.Column(db.Integer, primary_key=True)
    model_type = db.Column(db.String(32), nullable=False)
    version = db.Column(db.String(32), nullable=False)
    round_number = db.Column(db.Integer)
    num_clients = db.Column(db.Integer)
    accuracy = db.Column(db.Float)
    model_path = db.Column(db.String(512))
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    metadata_json = db.Column(db.Text, default='{}')


class EmergencyEvent(db.Model):
    __tablename__ = 'emergency_events'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), nullable=False)
    user_id = db.Column(db.String(64))
    sign_detected = db.Column(db.String(128))
    emotion_detected = db.Column(db.String(32))
    confidence = db.Column(db.Float)
    was_confirmed = db.Column(db.Boolean)
    action_taken = db.Column(db.String(256))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)