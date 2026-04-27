"""
WebSocket handler for real-time frame streaming.

The frontend streams camera frames over WebSocket; the backend runs
the full pipeline on each frame and emits results back in real time.
"""

import time
import uuid
import logging
import traceback
import numpy as np
from flask import request
from flask_socketio import emit, join_room, leave_room

from preprocessing.frame_processor import FrameProcessor
from models import model_manager
from utils.metrics import metrics

logger = logging.getLogger(__name__)

# Per-connection state
_sessions: dict = {}


def register_websocket_handlers(socketio, app):
    """Attach all SocketIO event handlers."""

    @socketio.on('connect')
    def handle_connect(auth=None):
        sid = request.sid
        session_id = str(uuid.uuid4())
        try:
            fp = FrameProcessor(app.config)
        except Exception as e:
            logger.error(f"FrameProcessor init failed: {e}")
            fp = None
        _sessions[sid] = {
            'session_id': session_id,
            'frame_processor': fp,
            'language': 'en',
            'user_id': None,
            'frame_count': 0,
            'connected_at': time.time(),
        }
        join_room(session_id)
        emit('connected', {
            'session_id': session_id,
            'status': 'ok',
            'models_ready': model_manager.is_initialized,
            'demo_mode': model_manager.demo_mode,
        })
        logger.info(f"Client connected: {sid} → session {session_id}")

    @socketio.on('disconnect')
    def handle_disconnect():
        sid = request.sid
        session = _sessions.pop(sid, None)
        if session:
            try:
                session['frame_processor'].release()
            except Exception:
                pass
            logger.info(f"Client disconnected: {sid}")

    @socketio.on('configure')
    def handle_configure(data):
        """Client sends preferences: language, user_id, etc."""
        sid = request.sid
        if sid not in _sessions:
            return
        session = _sessions[sid]
        session['language'] = data.get('language', 'en')
        session['user_id'] = data.get('user_id')
        emit('configured', {'status': 'ok', 'language': session['language']})

    @socketio.on('frame')
    def handle_frame(data):
        """
        Main real-time handler: receive base64 frame, run pipeline, emit result.
        """
        sid = request.sid
        session = _sessions.get(sid)
        if not session or not model_manager.is_initialized:
            emit('error', {'message': 'Not ready'})
            return

        fp = session['frame_processor']

        t_start = time.time()
        language = session['language']
        session['frame_count'] += 1

        try:
            # If frame processor is unavailable, run in pure demo mode
            if fp is None:
                # Demo mode: skip frame decoding, just run models directly
                features = {
                    'frame_id': session['frame_count'],
                    'timestamp': time.time(),
                    'hand': {'has_hands': False, 'combined_keypoints': np.zeros(226, dtype=np.float32)},
                    'face': {'has_face': False, 'face_crop': None},
                }
            else:
                # Decode frame
                frame_b64 = data.get('frame', '')
                frame = fp.decode_base64_frame(frame_b64)
                if frame is None:
                    emit('error', {'message': 'Invalid frame'})
                    return

                # 1. Preprocess
                features = fp.process(frame)

            # 2. Gesture recognition
            gesture_result = None
            detection_status = 'idle'

            if features['hand']['has_hands']:
                detection_status = 'detecting'
                kp = features['hand']['combined_keypoints']
                model_manager.gesture_model.feed_frame(kp)
                gesture_result = model_manager.gesture_model.try_recognize()
                if gesture_result and gesture_result.get('is_confident'):
                    detection_status = 'recognized'
            else:
                # Still feed frames in demo mode so the counter advances
                if model_manager.demo_mode:
                    model_manager.gesture_model.feed_frame(
                        np.zeros(226, dtype=np.float32))
                    gesture_result = model_manager.gesture_model.try_recognize()
                    if gesture_result:
                        detection_status = 'recognized'
                        features['hand']['has_hands'] = True

            # 3. Emotion recognition
            emotion_result = None
            if features['face']['has_face'] and features['face'].get('face_crop') is not None:
                try:
                    emotion_result = model_manager.emotion_model.recognize(
                        features['face']['face_crop']
                    )
                except Exception as e:
                    logger.debug(f"Emotion recognition error: {e}")
            elif model_manager.demo_mode and gesture_result:
                # In demo mode, produce emotion results alongside gestures
                emotion_result = model_manager.emotion_model.recognize(
                    np.zeros((48, 48), dtype=np.float32))

            # 4. Translation (only on recognized gesture)
            translation_result = None
            tts_result = None
            is_emergency = False

            if gesture_result and gesture_result.get('is_confident'):
                try:
                    gesture_emb = gesture_result.get('embedding',
                                                      np.zeros(256, dtype=np.float32))
                    emotion_emb = (emotion_result.get('embedding',
                                                       np.zeros(64, dtype=np.float32))
                                   if emotion_result else np.zeros(64, dtype=np.float32))

                    fusion_result = model_manager.fusion_model.fuse(gesture_emb, emotion_emb)

                    detected_emotion = (emotion_result['emotion']
                                        if emotion_result and emotion_result.get('is_confident')
                                        else 'neutral')
                    emotion_conf = emotion_result['confidence'] if emotion_result else 0.0

                    if model_manager.translation_engine:
                        translation_result = model_manager.translation_engine.translate(
                            sign_gloss=gesture_result['sign'],
                            emotion=detected_emotion,
                            emotion_confidence=emotion_conf,
                        )
                        is_emergency = translation_result.get('is_emergency', False)

                        # TTS
                        if model_manager.tts_engine:
                            tts_text = translation_result['texts'].get(
                                language, translation_result['texts']['en'])
                            try:
                                if is_emergency:
                                    tts_result = model_manager.tts_engine.synthesize_emergency(
                                        tts_text, language)
                                else:
                                    tts_result = model_manager.tts_engine.synthesize(
                                        tts_text, language, detected_emotion)
                            except Exception as e:
                                logger.debug(f"TTS error: {e}")
                except Exception as e:
                    logger.error(f"Translation pipeline error: {e}")

            total_ms = (time.time() - t_start) * 1000

            # Build response
            response = {
                'frame_id': features['frame_id'],
                'session_id': session['session_id'],
                'timestamp': time.time(),
                'hand_detected': features['hand']['has_hands'],
                'face_detected': features['face']['has_face'],
                'detection_status': detection_status,
                'demo_mode': model_manager.demo_mode,
            }

            if gesture_result:
                response['gesture'] = {
                    'sign': gesture_result['sign'],
                    'confidence': gesture_result['confidence'],
                    'is_confident': gesture_result['is_confident'],
                    'needs_disambiguation': gesture_result.get('needs_disambiguation', False),
                    'top_k': gesture_result.get('top_k', [])[:3],
                }

            if emotion_result:
                response['emotion'] = {
                    'emotion': emotion_result['emotion'],
                    'confidence': emotion_result['confidence'],
                    'probabilities': emotion_result.get('probabilities', {}),
                }

            if translation_result:
                response['translation'] = {
                    'texts': translation_result['texts'],
                    'emotion_applied': translation_result.get('emotion_applied'),
                    'is_emergency': is_emergency,
                }

            if tts_result and tts_result.get('audio_base64'):
                response['tts'] = {
                    'audio_base64': tts_result['audio_base64'],
                    'cache_hit': tts_result.get('cache_hit', False),
                }

            response['pipeline_latency_ms'] = round(total_ms, 1)

            # Emit result
            emit('result', response)

            # Emergency alert — emit on a separate channel
            if is_emergency:
                emit('emergency', {
                    'sign': gesture_result['sign'],
                    'emotion': emotion_result['emotion'] if emotion_result else 'unknown',
                    'text': translation_result['texts'],
                    'confidence': gesture_result['confidence'],
                    'session_id': session['session_id'],
                })

            # Disambiguation prompt
            if gesture_result and gesture_result.get('needs_disambiguation'):
                emit('disambiguate', {
                    'options': gesture_result.get('top_k', [])[:3],
                    'session_id': session['session_id'],
                })

        except Exception as e:
            logger.error(f"Frame processing error: {traceback.format_exc()}")
            emit('error', {'message': f'Processing error: {str(e)}'})

    @socketio.on('text_input')
    def handle_text_input(data):
        """Hearing user sends text → convert to ISL gloss for deaf user."""
        sid = request.sid
        session = _sessions.get(sid)
        if not session:
            return

        text = data.get('text', '')
        source_lang = data.get('language', session['language'])

        try:
            if model_manager.translation_engine:
                result = model_manager.translation_engine.translate_text_to_isl_gloss(
                    text, source_lang
                )
                emit('isl_gloss', {
                    'gloss_sequence': result['gloss_sequence'],
                    'display_text': result['display_text'],
                    'source_language': result['source_language'],
                    'session_id': session['session_id'],
                })
            else:
                # Fallback: simple tokenization
                tokens = text.lower().split()
                emit('isl_gloss', {
                    'gloss_sequence': tokens,
                    'display_text': text,
                    'source_language': source_lang,
                    'session_id': session['session_id'],
                })
        except Exception as e:
            logger.error(f"Text input error: {e}")
            emit('error', {'message': str(e)})

    @socketio.on('reset')
    def handle_reset():
        """Reset gesture buffer."""
        sid = request.sid
        if sid in _sessions:
            try:
                model_manager.gesture_model.reset()
            except Exception:
                pass
            emit('reset_ack', {'status': 'ok'})