"""Unit tests for emotion recognition."""

import os
import sys
import pytest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import TestingConfig
from models.emotion_model import EmotionRecognizer


@pytest.fixture
def recognizer():
    return EmotionRecognizer(vars(TestingConfig))


def test_model_builds(recognizer):
    assert recognizer.model is not None
    assert recognizer.num_classes == 7


def test_recognize_returns_valid_output(recognizer):
    face = np.random.rand(48, 48).astype(np.float32)
    result = recognizer.recognize(face)

    assert 'emotion' in result
    assert result['emotion'] in recognizer.classes
    assert 0 <= result['confidence'] <= 1
    assert 'probabilities' in result
    assert len(result['probabilities']) == 7


def test_all_probabilities_sum_to_one(recognizer):
    face = np.random.rand(48, 48).astype(np.float32)
    result = recognizer.recognize(face)
    total = sum(result['probabilities'].values())
    assert abs(total - 1.0) < 0.01