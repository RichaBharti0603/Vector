import sys
import os
import uuid
from typing import Dict, Any, Tuple

# Ensure triage_env can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from triage_env.env import EmailTriageEnv
from core.models import EventPayload, Priority, AgentType

class VectorTriageEngine:
    def __init__(self):
        self.env = EmailTriageEnv()
        
    def process_email(self, email_payload: Dict[str, Any]) -> Tuple[str, EventPayload]:
        """
        Runs an email through the RL environment and maps it to a Vector event.
        Returns a tuple of (event_type, EventPayload).
        """
        # 1. Convert to RL Observation
        obs = self.env._get_obs_from_email(email_payload)
        
        # 2. Get Decision from RL Engine
        action, confidence = self.env.predict(obs)
        
        # 3. Map to Vector Logic
        event_type = "VECTOR_CLASSIFIED"
        agent_type = AgentType.INTAKE
        priority = Priority.LOW
        summary = "Standard routing"
        recommended_action = "File to appropriate department"
        
        urgency, dept, sender = obs
        
        # Generate human-readable trace
        trace_lines = [
            f"RL Inference [Urgency: {urgency:.2f}, Dept: {dept:.2f}, Sender: {sender:.2f}]",
            f"Decision Vector -> Action {action}",
        ]
        
        if action == 3:
            event_type = "VECTOR_SECURITY_ALERT"
            agent_type = AgentType.SECURITY
            priority = Priority.URGENT
            summary = "Security anomaly detected in payload"
            recommended_action = "Immediate SOC Review"
            trace_lines.append("High department score associated with security risks triggered Anomaly Agent.")
        elif action == 2:
            event_type = "VECTOR_ESCALATION"
            agent_type = AgentType.ESCALATION
            priority = Priority.HIGH
            summary = "Critical escalation required"
            recommended_action = "Escalate to on-call Engineer"
            trace_lines.append("Urgency or sender importance exceeded escalation threshold.")
        elif action == 1:
            event_type = "VECTOR_ROUTE_UPDATE"
            agent_type = AgentType.ROUTING
            priority = Priority.MEDIUM
            summary = "Routine classification and routing"
            trace_lines.append("Standard routing parameters detected.")
        else:
            trace_lines.append("Email categorized as low priority background noise.")
            
        trace_lines.append(f"Engine Confidence: {confidence*100:.1f}%")
        
        intelligence_trace = "\n".join(trace_lines)
        
        payload = EventPayload(
            id=str(uuid.uuid4()),
            agent_type=agent_type,
            priority=priority,
            message=email_payload.get("subject", "Incoming Email"),
            summary=summary,
            recommended_action=recommended_action,
            confidence_score=confidence,
            metadata={
                "rl_action": action, 
                "rl_obs": obs.tolist(),
                "original_sender": email_payload.get("sender", "Unknown"),
                "original_subject": email_payload.get("subject", "No Subject")
            },
            intelligence_trace=intelligence_trace
        )
        
        return event_type, payload
