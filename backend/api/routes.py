"""
REST API routes for the ISL Translation System.
"""

import time
import uuid
import logging
import numpy as np
from flask import Blueprint, request, jsonify, current_app

from api.middleware import rate_limit, validate_json
from models import model_manager
from preprocessing.frame_processor import FrameProcessor
from utils.metrics import metrics
from database.db import db
from database.models_db import (ConversationLog, UserProfile,
                                 TranslationRecord, EmergencyEvent)

logger = logging.getLogger(__name__)
api_bp = Blueprint('api', __name__)

@api_bp.route('/nlp/translate', methods=['POST'])
def nlp_translate():
    from utils.nlp import convert_isl_to_english
    data = request.json
    words = data.get('words', [])
    sentence = convert_isl_to_english(words)
    return jsonify({'sentence': sentence})

# Lazy singleton for frame processor
_frame_processor: FrameProcessor = None


def _get_fp() -> FrameProcessor:
    global _frame_processor
    if _frame_processor is None:
        _frame_processor = FrameProcessor(current_app.config)
    return _frame_processor


# ─── Health ──────────────────────────────────────────────────────────────

@api_bp.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'models': model_manager.get_status(),
        'timestamp': time.time(),
    })


@api_bp.route('/metrics', methods=['GET'])
def get_metrics():
    return jsonify(metrics.get_summary())


# ─── ISL → Text pipeline (single frame batch) ───────────────────────────

@api_bp.route('/translate/frame', methods=['POST'])
@rate_limit
def translate_frame():
    """
    Accept a base64-encoded camera frame, run the full pipeline,
    return gesture + emotion + translation.
    """
    data = request.get_json(silent=True)
    if not data or 'frame' not in data:
        return jsonify({'error': 'Missing "frame" field (base64)'}), 400

    t_start = time.time()
    fp = _get_fp()
    frame = fp.decode_base64_frame(data['frame'])
    if frame is None:
        return jsonify({'error': 'Invalid frame data'}), 400

    session_id = data.get('session_id', str(uuid.uuid4()))
    language = data.get('language', 'en')
    user_id = data.get('user_id')

    # 1. Preprocessing
    features = fp.process(frame)
    metrics.record_latency('preprocessing', features['preprocessing_time_ms'])

    # 2. Feed keypoints into gesture buffer
    gesture_result = None
    if features['hand']['has_hands']:
        kp = features['hand']['combined_keypoints']
        model_manager.gesture_model.feed_frame(kp)
        gesture_result = model_manager.gesture_model.try_recognize()
        if gesture_result:
            metrics.record_latency('gesture_inference', gesture_result['latency_ms'])
            metrics.record_confidence('gesture', gesture_result['confidence'])

    # 3. Emotion recognition
    emotion_result = None
    if features['face']['has_face'] and features['face']['face_crop'] is not None:
        emotion_result = model_manager.emotion_model.recognize(
            features['face']['face_crop']
        )
        if emotion_result:
            metrics.record_latency('emotion_inference', emotion_result['latency_ms'])
            metrics.record_confidence('emotion', emotion_result['confidence'])

    # 4. Fusion + Translation (only when gesture is recognized)
    translation_result = None
    fusion_result = None
    tts_result = None
    is_emergency = False

    if gesture_result and gesture_result['is_confident']:
        # Get embeddings for fusion
        gesture_emb = gesture_result.get('embedding',
                                          np.zeros(256, dtype=np.float32))
        emotion_emb = (emotion_result.get('embedding',
                                           np.zeros(64, dtype=np.float32))
                       if emotion_result else np.zeros(64, dtype=np.float32))

        # Fuse
        fusion_result = model_manager.fusion_model.fuse(gesture_emb, emotion_emb)
        metrics.record_latency('fusion', fusion_result['latency_ms'])

        # Translate
        detected_emotion = (emotion_result['emotion']
                            if emotion_result and emotion_result['is_confident']
                            else 'neutral')
        emotion_conf = (emotion_result['confidence']
                        if emotion_result else 0.0)

        translation_result = model_manager.translation_engine.translate(
            sign_gloss=gesture_result['sign'],
            emotion=detected_emotion,
            emotion_confidence=emotion_conf,
        )
        is_emergency = translation_result.get('is_emergency', False)
        metrics.record_prediction(gesture_result['sign'])

        # TTS
        text_for_tts = translation_result['texts'].get(language,
                                                        translation_result['texts']['en'])
        if is_emergency:
            tts_result = model_manager.tts_engine.synthesize_emergency(
                text_for_tts, language
            )
        else:
            tts_result = model_manager.tts_engine.synthesize(
                text_for_tts, language, detected_emotion
            )
        metrics.record_latency('tts', 0)  # TTS is async / cached

    # 5. Compute total latency
    total_ms = (time.time() - t_start) * 1000
    metrics.record_latency('total_pipeline', total_ms)

    # 6. Log to database
    try:
        log_entry = ConversationLog(
            session_id=session_id,
            user_id=user_id,
            direction='isl_to_text',
            recognized_sign=(gesture_result['sign']
                             if gesture_result else None),
            gesture_confidence=(gesture_result['confidence']
                                if gesture_result else None),
            detected_emotion=(emotion_result['emotion']
                              if emotion_result else None),
            emotion_confidence=(emotion_result['confidence']
                                if emotion_result else None),
            translated_text_en=(translation_result['texts'].get('en')
                                if translation_result else None),
            translated_text_ta=(translation_result['texts'].get('ta')
                                if translation_result else None),
            translated_text_hi=(translation_result['texts'].get('hi')
                                if translation_result else None),
            is_emergency=is_emergency,
            was_disambiguated=(gesture_result.get('needs_disambiguation', False)
                               if gesture_result else False),
            disambiguation_options=(
                str(gesture_result.get('top_k', []))
                if gesture_result and gesture_result.get('needs_disambiguation')
                else None
            ),
            pipeline_latency_ms=total_ms,
        )
        db.session.add(log_entry)

        # Log emergency event separately
        if is_emergency:
            emergency_entry = EmergencyEvent(
                session_id=session_id,
                user_id=user_id,
                sign_detected=gesture_result['sign'],
                emotion_detected=(emotion_result['emotion']
                                  if emotion_result else 'unknown'),
                confidence=gesture_result['confidence'],
                was_confirmed=False,
                action_taken='alert_displayed',
            )
            db.session.add(emergency_entry)

        db.session.commit()
    except Exception as e:
        logger.error(f"DB logging error: {e}")
        db.session.rollback()

    # 7. Build response
    response = {
        'session_id': session_id,
        'frame_id': features['frame_id'],
        'timestamp': features['timestamp'],

        'hand_detected': features['hand']['has_hands'],
        'face_detected': features['face']['has_face'],

        'gesture': {
            'sign': gesture_result['sign'] if gesture_result else None,
            'confidence': gesture_result['confidence'] if gesture_result else None,
            'is_confident': gesture_result['is_confident'] if gesture_result else False,
            'needs_disambiguation': (gesture_result.get('needs_disambiguation', False)
                                     if gesture_result else False),
            'top_k': gesture_result.get('top_k', []) if gesture_result else [],
            'latency_ms': gesture_result['latency_ms'] if gesture_result else None,
        } if gesture_result else None,

        'emotion': {
            'emotion': emotion_result['emotion'] if emotion_result else None,
            'confidence': emotion_result['confidence'] if emotion_result else None,
            'probabilities': emotion_result.get('probabilities', {}) if emotion_result else {},
            'latency_ms': emotion_result['latency_ms'] if emotion_result else None,
        } if emotion_result else None,

        'translation': {
            'texts': translation_result['texts'] if translation_result else None,
            'emotion_applied': (translation_result.get('emotion_applied')
                                if translation_result else None),
            'is_emergency': is_emergency,
        } if translation_result else None,

        'tts': {
            'audio_base64': tts_result.get('audio_base64') if tts_result else None,
            'cache_hit': tts_result.get('cache_hit') if tts_result else None,
        } if tts_result else None,

        'pipeline_latency_ms': total_ms,
    }

    return jsonify(response)


# ─── Text / Speech → ISL direction ──────────────────────────────────────

@api_bp.route('/translate/text-to-isl', methods=['POST'])
@rate_limit
@validate_json(['text'])
def text_to_isl():
    """
    Hearing user types/speaks text → system converts to ISL gloss
    sequence + display text for the deaf user.
    """
    data = request.get_json()
    text = data['text']
    source_lang = data.get('language', 'en')
    session_id = data.get('session_id', str(uuid.uuid4()))
    user_id = data.get('user_id')

    result = model_manager.translation_engine.translate_text_to_isl_gloss(
        text, source_lang
    )

    # Log
    try:
        log_entry = ConversationLog(
            session_id=session_id,
            user_id=user_id,
            direction='text_to_isl',
            input_text=text,
            input_language=source_lang,
            translated_text_en=text if source_lang == 'en' else None,
            translated_text_ta=text if source_lang == 'ta' else None,
            translated_text_hi=text if source_lang == 'hi' else None,
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        logger.error(f"DB error: {e}")
        db.session.rollback()

    return jsonify({
        'session_id': session_id,
        'gloss_sequence': result['gloss_sequence'],
        'display_text': result['display_text'],
        'source_language': result['source_language'],
        'avatar_ready': False,  # Future: set True when avatar module available
    })


# ─── TTS endpoint ───────────────────────────────────────────────────────

@api_bp.route('/tts', methods=['POST'])
@rate_limit
@validate_json(['text'])
def text_to_speech():
    """Standalone TTS endpoint."""
    data = request.get_json()
    text = data['text']
    language = data.get('language', 'en')
    emotion = data.get('emotion', 'neutral')

    result = model_manager.tts_engine.synthesize(text, language, emotion)
    return jsonify(result)


# ─── Disambiguation confirmation ────────────────────────────────────────

@api_bp.route('/disambiguate', methods=['POST'])
@rate_limit
@validate_json(['session_id', 'selected_sign'])
def disambiguate():
    """
    User confirms which sign was intended from the disambiguation prompt.
    Re-runs translation with the confirmed sign.
    """
    data = request.get_json()
    session_id = data['session_id']
    selected_sign = data['selected_sign']
    language = data.get('language', 'en')
    emotion = data.get('emotion', 'neutral')
    emotion_confidence = data.get('emotion_confidence', 0.5)

    # Re-translate with confirmed sign
    translation_result = model_manager.translation_engine.translate(
        sign_gloss=selected_sign,
        emotion=emotion,
        emotion_confidence=emotion_confidence,
    )

    # TTS
    text_for_tts = translation_result['texts'].get(language,
                                                    translation_result['texts']['en'])
    tts_result = model_manager.tts_engine.synthesize(text_for_tts, language, emotion)

    # Update conversation log
    try:
        log = ConversationLog.query.filter_by(session_id=session_id).order_by(
            ConversationLog.timestamp.desc()
        ).first()
        if log:
            log.was_disambiguated = True
            log.user_selected_option = selected_sign
            log.recognized_sign = selected_sign
            log.translated_text_en = translation_result['texts'].get('en')
            log.translated_text_ta = translation_result['texts'].get('ta')
            log.translated_text_hi = translation_result['texts'].get('hi')
            db.session.commit()
    except Exception as e:
        logger.error(f"DB error: {e}")
        db.session.rollback()

    return jsonify({
        'confirmed_sign': selected_sign,
        'translation': translation_result,
        'tts': {
            'audio_base64': tts_result.get('audio_base64'),
            'cache_hit': tts_result.get('cache_hit'),
        },
    })


# ─── Conversation history ───────────────────────────────────────────────

@api_bp.route('/conversation/<session_id>', methods=['GET'])
@rate_limit
def get_conversation(session_id):
    """Retrieve conversation history for a session."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    logs = ConversationLog.query.filter_by(session_id=session_id).order_by(
        ConversationLog.timestamp.asc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'session_id': session_id,
        'messages': [log.to_dict() for log in logs.items],
        'total': logs.total,
        'page': logs.page,
        'pages': logs.pages,
    })


# ─── User profiles (gesture style adaptation) ───────────────────────────

@api_bp.route('/profile', methods=['POST'])
@rate_limit
@validate_json(['user_id'])
def create_or_update_profile():
    """Create or update a user profile for adaptive inference."""
    data = request.get_json()
    user_id = data['user_id']

    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)

    profile.display_name = data.get('display_name', profile.display_name)
    profile.preferred_language = data.get('preferred_language',
                                          profile.preferred_language or 'en')
    profile.signing_speed = data.get('signing_speed',
                                      profile.signing_speed or 'normal')
    profile.region = data.get('region', profile.region)
    profile.age_group = data.get('age_group', profile.age_group)

    if 'settings' in data:
        profile.settings = data['settings']

    try:
        db.session.commit()
        return jsonify({'status': 'ok', 'profile': profile.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/profile/<user_id>', methods=['GET'])
@rate_limit
def get_profile(user_id):
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify(profile.to_dict())


# ─── Emergency events ───────────────────────────────────────────────────

@api_bp.route('/emergency/confirm', methods=['POST'])
@rate_limit
@validate_json(['event_id', 'confirmed'])
def confirm_emergency():
    """User confirms or dismisses an emergency alert."""
    data = request.get_json()
    event = EmergencyEvent.query.get(data['event_id'])
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    event.was_confirmed = data['confirmed']
    event.action_taken = data.get('action', 'user_confirmed' if data['confirmed']
                                  else 'user_dismissed')
    try:
        db.session.commit()
        return jsonify({'status': 'ok'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ─── Federated Learning endpoints ───────────────────────────────────────

@api_bp.route('/federated/status', methods=['GET'])
def fl_status():
    from models.federated_learning import FederatedServer
    # In production this would be a persistent server instance
    return jsonify({'message': 'FL endpoint placeholder', 'enabled': False})


@api_bp.route('/federated/submit-update', methods=['POST'])
@rate_limit
def fl_submit_update():
    """
    Client submits local model weight updates.
    In production, weights would be serialized via protobuf or numpy.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    # Placeholder — real implementation would deserialize numpy arrays
    return jsonify({
        'status': 'received',
        'message': 'FL update queued for aggregation',
    })


# ─── Supported languages ────────────────────────────────────────────────

@api_bp.route('/languages', methods=['GET'])
def supported_languages():
    return jsonify(model_manager.translation_engine.get_supported_languages())


# ─── Vocabulary ─────────────────────────────────────────────────────────

@api_bp.route('/vocabulary', methods=['GET'])
def get_vocabulary():
    """Return the full ISL vocabulary the system supports."""
    vocab = model_manager.gesture_model.vocabulary
    return jsonify({
        'total': len(vocab),
        'signs': vocab,
    })


# ─── Model reset ────────────────────────────────────────────────────────

@api_bp.route('/reset', methods=['POST'])
@rate_limit
def reset_pipeline():
    """Reset the gesture sequence buffer (e.g. when user switches context)."""
    model_manager.gesture_model.reset()
    return jsonify({'status': 'ok', 'message': 'Pipeline buffers reset'})