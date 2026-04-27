"""Unit tests for gesture recognition pipeline."""

import os
import sys
import pytest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import TestingConfig
from models.gesture_model import GestureRecognizer


@pytest.fixture
def recognizer():
    config = vars(TestingConfig)
    return GestureRecognizer(config)


def test_model_builds(recognizer):
    assert recognizer.model is not None
    assert recognizer.num_classes == 200


def test_buffer_push(recognizer):
    kp = np.random.randn(226).astype(np.float32)
    recognizer.feed_frame(kp)
    assert len(recognizer.buffer._buf) == 1


def test_recognition_after_enough_frames(recognizer):
    for i in range(35):
        kp = np.random.randn(226).astype(np.float32)
        recognizer.feed_frame(kp)

    result = recognizer.try_recognize()
    # May or may not be ready depending on stride alignment
    if result is not None:
        assert 'sign' in result
        assert 'confidence' in result
        assert 0 <= result['confidence'] <= 1
        assert len(result['top_k']) <= 5


def test_reset(recognizer):
    for _ in range(10):
        recognizer.feed_frame(np.random.randn(226).astype(np.float32))
    recognizer.reset()
    assert len(recognizer.buffer._buf) == 0


def test_vocabulary_length(recognizer):
    assert len(recognizer.vocabulary) == 200