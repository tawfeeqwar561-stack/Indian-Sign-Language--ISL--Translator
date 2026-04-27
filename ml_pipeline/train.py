import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import TensorBoard, EarlyStopping
from sklearn.model_selection import train_test_split

PROCESSED_DATA_PATH = 'ml_pipeline/processed_data'
MODEL_EXPORT_PATH = 'ml_pipeline/export/sequence_model.h5'

def train_model():
    # 1. Load Data
    labels = sorted([d for d in os.listdir(PROCESSED_DATA_PATH) if os.path.isdir(os.path.join(PROCESSED_DATA_PATH, d))])
    label_map = {label: i for i, label in enumerate(labels)}
    
    X, y = [], []
    for label in labels:
        label_dir = os.path.join(PROCESSED_DATA_PATH, label)
        sequences = [f for f in os.listdir(label_dir) if f.endswith('.npy')]
        for seq_file in sequences:
            res = np.load(os.path.join(label_dir, seq_file))
            X.append(res)
            y.append(label_map[label])
            
    X = np.array(X)
    y = tf.keras.utils.to_categorical(y).astype(int)
    
    print(f"Dataset loaded. X shape: {X.shape}, y shape: {y.shape}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)
    
    # 2. Build Model
    model = Sequential([
        LSTM(64, return_sequences=True, activation='relu', input_shape=(X.shape[1], X.shape[2])),
        Dropout(0.2),
        LSTM(128, return_sequences=True, activation='relu'),
        Dropout(0.2),
        LSTM(64, return_sequences=False, activation='relu'),
        BatchNormalization(),
        Dense(64, activation='relu'),
        Dense(len(labels), activation='softmax')
    ])
    
    model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])
    
    # 3. Train
    early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
    
    print("Starting training...")
    model.fit(X_train, y_train, 
              epochs=100, 
              validation_data=(X_test, y_test),
              callbacks=[early_stopping])
    
    # 4. Save
    if not os.path.exists(os.path.dirname(MODEL_EXPORT_PATH)):
        os.makedirs(os.path.dirname(MODEL_EXPORT_PATH))
    model.save(MODEL_EXPORT_PATH)
    print(f"Model saved to {MODEL_EXPORT_PATH}")
    
    # Save label list for inference
    with open('ml_pipeline/export/labels.txt', 'w') as f:
        f.write('\n'.join(labels))

if __name__ == "__main__":
    if not os.listdir(PROCESSED_DATA_PATH):
        print("No processed data found. Run preprocess.py first.")
    else:
        train_model()
