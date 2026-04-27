"""Integration tests for the REST API."""

import os
import sys
import json
import pytest
import base64
import numpy as np
import cv2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from config import TestingConfig


@pytest.fixture
def client():
    app = create_app(TestingConfig)
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c


def test_health(client):
    resp = client.get('/api/health')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['status'] == 'ok'


def test_metrics(client):
    resp = client.get('/api/metrics')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'latency' in data


def test_languages(client):
    resp = client.get('/api/languages')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'en' in data
    assert 'ta' in data
    assert 'hi' in data


def test_vocabulary(client):
    resp = client.get('/api/vocabulary')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['total'] == 200


def test_text_to_isl(client):
    resp = client.post('/api/translate/text-to-isl',
                       json={'text': 'Hello friend', 'language': 'en'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'gloss_sequence' in data


def test_tts(client):
    resp = client.post('/api/tts',
                       json={'text': 'Hello', 'language': 'en'})
    assert resp.status_code == 200


def test_frame_missing_body(client):
    resp = client.post('/api/translate/frame', json={})
    assert resp.status_code == 400


def test_translate_frame_with_dummy_image(client):
    # Create a dummy image and encode as base64
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    _, buf = cv2.imencode('.jpg', img)
    b64 = base64.b64encode(buf).decode('utf-8')

    resp = client.post('/api/translate/frame',
                       json={'frame': b64, 'language': 'en'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'hand_detected' in data
    assert 'face_detected' in data


def test_reset(client):
    resp = client.post('/api/reset')
    assert resp.status_code == 200


def test_profile_crud(client):
    # Create
    resp = client.post('/api/profile', json={
        'user_id': 'test_user_1',
        'display_name': 'Test',
        'preferred_language': 'ta',
    })
    assert resp.status_code == 200

    # Read
    resp = client.get('/api/profile/test_user_1')
    assert resp.status_code == 200
    assert resp.get_json()['preferred_language'] == 'ta'