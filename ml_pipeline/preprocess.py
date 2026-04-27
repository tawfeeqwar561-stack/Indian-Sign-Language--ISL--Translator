import cv2
import mediapipe as mp
import numpy as np
import os
import time

mp_hands = mp.solutions.hands
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

DATASET_PATH = 'ml_pipeline/dataset'
OUTPUT_PATH = 'ml_pipeline/processed_data'
SEQUENCE_LENGTH = 30 # Number of frames per sign sequence

def extract_landmarks(image, hands, pose):
    # Convert BGR to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results_hands = hands.process(image_rgb)
    results_pose = pose.process(image_rgb)
    
    # Extract Hand Landmarks (2 hands * 21 points * 3 coords = 126)
    lh = np.zeros(63)
    rh = np.zeros(63)
    
    if results_hands.multi_hand_landmarks:
        for i, hand_landmarks in enumerate(results_hands.multi_hand_landmarks):
            # Check if left or right
            handedness = results_hands.multi_handedness[i].classification[0].label
            landmarks = np.array([[res.x, res.y, res.z] for res in hand_landmarks.landmark]).flatten()
            if handedness == 'Left':
                lh = landmarks
            else:
                rh = landmarks
                
    # Extract Pose Landmarks (subset for upper body)
    pose_landmarks = np.zeros(99) # 33 points * 3
    if results_pose.pose_landmarks:
        pose_landmarks = np.array([[res.x, res.y, res.z] for res in results_pose.pose_landmarks.landmark]).flatten()
        
    return np.concatenate([pose_landmarks, lh, rh])

def process_videos():
    if not os.path.exists(OUTPUT_PATH):
        os.makedirs(OUTPUT_PATH)
        
    hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)
    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5)
    
    labels = [d for d in os.listdir(DATASET_PATH) if os.path.isdir(os.path.join(DATASET_PATH, d))]
    
    for label in labels:
        label_dir = os.path.join(DATASET_PATH, label)
        output_label_dir = os.path.join(OUTPUT_PATH, label)
        if not os.path.exists(output_label_dir):
            os.makedirs(output_label_dir)
            
        videos = [v for v in os.listdir(label_dir) if v.endswith(('.mp4', '.avi', '.mov'))]
        print(f"Processing label: {label} ({len(videos)} videos)")
        
        for v_idx, video_name in enumerate(videos):
            cap = cv2.VideoCapture(os.path.join(label_dir, video_name))
            sequence = []
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                landmarks = extract_landmarks(frame, hands, pose)
                sequence.append(landmarks)
                
            cap.release()
            
            # Pad or truncate sequence to fixed length
            if len(sequence) < SEQUENCE_LENGTH:
                # Pad with last frame
                last_frame = sequence[-1] if sequence else np.zeros(225)
                while len(sequence) < SEQUENCE_LENGTH:
                    sequence.append(last_frame)
            elif len(sequence) > SEQUENCE_LENGTH:
                # Downsample or truncate (here we truncate)
                sequence = sequence[:SEQUENCE_LENGTH]
                
            # Save sequence as numpy array
            np.save(os.path.join(output_label_dir, f"{v_idx}.npy"), np.array(sequence))

    print("Preprocessing complete!")

if __name__ == "__main__":
    process_videos()
