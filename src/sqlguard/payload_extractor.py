
import re


# These patterns identify candidate fragments for further analysis.
# A match is not proof that the query is malicious.
PATTERNS = {
    "sql_comment": re.compile(
        r"--[^\r\n]*|/\*[\s\S]*?\*/|#[^\r\n]*"
    ),
    "boolean_condition": re.compile(
        r"\b(?:OR|AND)\b\s+"
        r"(?:'[^']*'|\"[^\"]*\"|\d+)\s*"
        r"(?:=|<>|!=|<|>|LIKE\b|IS\b)\s*"
        r"(?:'[^']*'|\"[^\"]*\"|\d+)",
        re.IGNORECASE,
    ),
    "union_select": re.compile(
        r"\bUNION\b\s+(?:ALL\s+)?\bSELECT\b[\s\S]*?"
        r"(?=\b(?:WHERE|GROUP\s+BY|ORDER\s+BY|LIMIT)\b|;|$)",
        re.IGNORECASE,
    ),
    "suspicious_function": re.compile(
        r"\b(?:SLEEP|BENCHMARK|UPDATEXML|EXTRACTVALUE|"
        r"LOAD_FILE|INTO\s+OUTFILE|XP_CMDSHELL)\b"
        r"[\s\S]{0,150}",
        re.IGNORECASE,
    ),
}


def extract_payloads(query: str) -> list[dict]:
    """
    Extract candidate fragments from a complete SQL query.

    The original query is retained as context. Additional fragments
    are extracted using simple rules; they are not guaranteed to be
    malicious or to cover every SQL injection technique.
    """
    if not isinstance(query, str):
        raise TypeError("query must be a string")

    query = query.strip()

    if not query:
        return []

    candidates = [
        {
            "text": query,
            "type": "full_query",
            "start": 0,
            "end": len(query),
        }
    ]

    for fragment_type, pattern in PATTERNS.items():
        for match in pattern.finditer(query):
            candidates.append(
                {
                    "text": match.group(0).strip(),
                    "type": fragment_type,
                    "start": match.start(),
                    "end": match.end(),
                }
            )

    # Remove duplicate matches while preserving their original order.
    unique_candidates = []
    seen = set()

    for candidate in candidates:
        key = (candidate["start"], candidate["end"], candidate["text"])

        if key not in seen:
            seen.add(key)
            unique_candidates.append(candidate)

    return unique_candidates
