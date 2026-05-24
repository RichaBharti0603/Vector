import gymnasium as gym
from gymnasium import spaces
import numpy as np
import hashlib

class EmailTriageEnv(gym.Env):
    """
    Deterministic mock of the RL Email Triage Environment.
    Accepts raw text or metadata, converts to a simple observation, and maps to deterministic actions.
    """
    def __init__(self):
        super(EmailTriageEnv, self).__init__()
        # Observation: [urgency_score, department_code, sender_importance]
        self.observation_space = spaces.Box(low=0, high=1, shape=(3,), dtype=np.float32)
        
        # Actions: Discrete decisions (0: Ignore, 1: Intake/Routine, 2: Escalate, 3: Security Alert)
        self.action_space = spaces.Discrete(4)

    def _get_obs_from_email(self, email_payload: dict):
        # Deterministically convert email to observation for demo
        text = email_payload.get("subject", "") + " " + email_payload.get("body", "")
        text = text.lower()
        
        urgency = 0.1
        if "urgent" in text or "outage" in text or "down" in text:
            urgency = 0.9
        elif "soon" in text or "important" in text:
            urgency = 0.6
            
        dept = 0.5
        if "security" in text or "breach" in text:
            dept = 0.8
            
        sender_importance = 0.5
        if email_payload.get("sender", "").endswith("@ceo.com"):
            sender_importance = 0.9
            
        return np.array([urgency, dept, sender_importance], dtype=np.float32)

    def predict(self, obs: np.ndarray, deterministic=True):
        """
        Mock the RL policy prediction step.
        obs: [urgency_score, department_code, sender_importance]
        """
        urgency, dept, sender = obs
        
        if dept > 0.7:
            action = 3  # Security Alert
        elif urgency > 0.8 or sender > 0.8:
            action = 2  # Escalate
        elif urgency > 0.3:
            action = 1  # Intake/Routine
        else:
            action = 0  # Ignore/Low Priority
            
        # Confidence score based on certainty
        confidence = float(min(1.0, max(urgency, dept, sender) + 0.1))
        
        return action, confidence

    def step(self, action):
        # Standard gym step, mostly unused in real-time inference wrapper
        return self.observation_space.sample(), 1.0, True, False, {}

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        return self.observation_space.sample(), {}
