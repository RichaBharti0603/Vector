import re

class PrivacyLayer:
    @staticmethod
    def strip_sensitive_content(body: str, strip_all: bool = True) -> str:
        """
        Removes sensitive PII or raw email bodies.
        If strip_all is True, replaces the entire body with a placeholder.
        Otherwise, does basic regex redaction.
        """
        if strip_all:
            # We keep minimal context for RL Engine depending on what it needs.
            # Usually the RL engine uses the body for classification.
            # If privacy is paramount, we truncate or only keep metadata.
            # For MVP, we pass a truncated version.
            return body[:100] + "... [TRUNCATED FOR PRIVACY]"
        
        # Basic PII stripping (SSN, credit cards, emails)
        safe_body = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED SSN]', body)
        safe_body = re.sub(r'\b(?:\d[ -]*?){13,16}\b', '[REDACTED CC]', safe_body)
        return safe_body
