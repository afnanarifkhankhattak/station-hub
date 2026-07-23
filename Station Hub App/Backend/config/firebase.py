import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import base64
from dotenv import load_dotenv

load_dotenv()

# Ways to provide Firebase credentials (any one works):
# 1. Path to JSON file: FIREBASE_CREDENTIALS=/path/to/serviceAccountKey.json
# 2. Full JSON string in FIREBASE_CREDENTIALS
# 3. Base64-encoded JSON in FIREBASE_CREDENTIALS
# 4. Render Secret File named serviceAccountKey.json (auto-detected)

_DEFAULT_PATHS = (
    "config/serviceAccountKey.json",
    "serviceAccountKey.json",
    "/etc/secrets/serviceAccountKey.json",
)


def _normalize(value: str) -> str:
    value = value.strip()
    # Remove wrapping quotes people sometimes paste into Render
    if (value.startswith("'") and value.endswith("'")) or (
        value.startswith('"') and value.endswith('"')
    ):
        value = value[1:-1].strip()
    return value


def _certificate_from_path(path: str):
    if path and os.path.isfile(path):
        return credentials.Certificate(path)
    return None


def _certificate_from_json_text(text: str):
    try:
        data = json.loads(text)
        if isinstance(data, dict) and data.get("type") == "service_account":
            return credentials.Certificate(data)
    except Exception:
        pass
    return None


def _certificate_from_base64(text: str):
    try:
        # Render / shells may wrap long values with whitespace/newlines
        cleaned = "".join(text.split())
        decoded = base64.b64decode(cleaned)
        data = json.loads(decoded)
        if isinstance(data, dict) and data.get("type") == "service_account":
            return credentials.Certificate(data)
    except Exception:
        pass
    return None


def _resolve_credentials():
    raw = os.getenv("FIREBASE_CREDENTIALS")
    tried = []

    if raw:
        value = _normalize(raw)
        tried.append(f"FIREBASE_CREDENTIALS={value[:80]}{'...' if len(value) > 80 else ''}")

        # 1) Exact path
        cred = _certificate_from_path(value)
        if cred:
            return cred

        # 2) If they still used the local path string, map common names to Render secrets
        basename = os.path.basename(value.rstrip("/"))
        for candidate in (
            value,
            os.path.join("/etc/secrets", basename),
            os.path.join("/etc/secrets", "serviceAccountKey.json"),
            basename,
            os.path.join("config", basename),
        ):
            if candidate in tried:
                continue
            tried.append(candidate)
            cred = _certificate_from_path(candidate)
            if cred:
                return cred

        # 3) JSON string
        cred = _certificate_from_json_text(value)
        if cred:
            return cred

        # 4) Base64 JSON
        cred = _certificate_from_base64(value)
        if cred:
            return cred

    # 5) Auto-detect local / Render secret files
    for path in _DEFAULT_PATHS:
        tried.append(path)
        cred = _certificate_from_path(path)
        if cred:
            return cred

    raise ValueError(
        "Could not load Firebase credentials. "
        "Set FIREBASE_CREDENTIALS to a real file path, full JSON, or base64 JSON. "
        "On Render, add a Secret File named serviceAccountKey.json and set "
        "FIREBASE_CREDENTIALS=/etc/secrets/serviceAccountKey.json. "
        f"Tried: {tried}"
    )


if not firebase_admin._apps:
    cred = _resolve_credentials()
    firebase_admin.initialize_app(cred)

db = firestore.client()
