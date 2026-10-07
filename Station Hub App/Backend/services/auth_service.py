from fastapi import HTTPException, status
from datetime import datetime, timedelta
from firebase_admin import auth as firebase_auth

from config.firebase import db
from models.user_model import UserModel
from schemas.auth_schemas import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    UpdateProfileRequest,
)
from utils.jwt_handler import create_access_token, create_refresh_token, verify_token
from utils.password_handler import hash_password, verify_password
from utils.email_handler import generate_otp, send_otp_email
from services.service_service import seed_default_services_for_owner


# ─── Helper ─────────────────────────────────────────────────
def _normalize_role(value) -> str:
    """
    Safely normalize a role value:
    - Handles None
    - Strips whitespace (including trailing \\n from Firestore edits)
    - Falls back to "user" if empty
    """
    if not value or not isinstance(value, str):
        return "user"
    cleaned = value.strip()
    return cleaned or "user"


# ─── Register ───────────────────────────────────────────────
def register_user(body: RegisterRequest) -> dict:
    # Reject admin role on public registration
    if body.role and body.role.strip().lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration for the 'admin' role is prohibited through this endpoint.",
        )

    existing = db.collection("users").where("email", "==", body.email).limit(1).get()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    normalized_role = _normalize_role(body.role)

    user = UserModel(
        full_name=body.full_name,
        email=body.email,
        role=normalized_role,
        password=hash_password(body.password),
        phone=body.phone or "",
    )

    doc_ref = db.collection("users").add(user.to_dict())
    user_id = doc_ref[1].id

    # Seed default services for station owners (non-blocking)
    if user.role == "station_owner":
        try:
            seed_default_services_for_owner(user_id)
        except Exception as e:
            print(f"Failed to seed default services for user {user_id}: {e}")

    # Generate tokens with normalized role
    token_payload = {
        "sub": user_id,
        "email": body.email,
        "role": normalized_role,
    }
    token = create_access_token(token_payload)
    refresh_token = create_refresh_token({"sub": user_id, "email": body.email})

    return {
        "message": "Registration successful",
        "token": token,
        "refresh_token": refresh_token,
        "user": {
            "id": user_id,
            "full_name": body.full_name,
            "email": body.email,
            "role": normalized_role,
            "phone": body.phone or "",
            "profile_image": "",
        },
    }


# ─── Login ──────────────────────────────────────────────────
def login_user(body: LoginRequest) -> dict:
    docs = db.collection("users").where("email", "==", body.email).limit(1).get()
    if not docs:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_doc = docs[0]
    user = user_doc.to_dict()

    if not verify_password(body.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_role = _normalize_role(user.get("role"))

    token = create_access_token({
        "sub": user_doc.id,
        "email": user["email"],
        "role": user_role,
    })
    refresh_token = create_refresh_token({
        "sub": user_doc.id,
        "email": user["email"],
    })

    return {
        "message": "Login successful",
        "token": token,
        "refresh_token": refresh_token,
        "user": {
            "id": user_doc.id,
            "full_name": user.get("full_name", ""),
            "email": user["email"],
            "role": user_role,
            "phone": user.get("phone", ""),
            "profile_image": user.get("profile_image", ""),
        },
    }


# ─── Forgot Password ────────────────────────────────────────
def forgot_password(body: ForgotPasswordRequest) -> dict:
    docs = db.collection("users").where("email", "==", body.email).limit(1).get()
    if not docs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")

    otp = generate_otp()
    expiry = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

    db.collection("otps").document(body.email).set({
        "otp": otp,
        "expires_at": expiry,
        "verified": False,
    })

    sent = send_otp_email(body.email, otp)
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email",
        )

    return {"message": "OTP sent to your email"}


# ─── Verify OTP ─────────────────────────────────────────────
def verify_otp(body: VerifyOTPRequest) -> dict:
    otp_doc = db.collection("otps").document(body.email).get()
    if not otp_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OTP not found")

    otp_data = otp_doc.to_dict()

    if datetime.utcnow().isoformat() > otp_data["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired")

    if otp_data["otp"] != body.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    db.collection("otps").document(body.email).update({"verified": True})

    return {"message": "OTP verified successfully"}


# ─── Reset Password ─────────────────────────────────────────
def reset_password(body: ResetPasswordRequest) -> dict:
    otp_doc = db.collection("otps").document(body.email).get()
    if not otp_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OTP not found")

    otp_data = otp_doc.to_dict()

    if not otp_data.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="OTP not verified",
        )

    if otp_data["otp"] != body.otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP",
        )

    docs = db.collection("users").where("email", "==", body.email).limit(1).get()
    if not docs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    docs[0].reference.update({"password": hash_password(body.new_password)})
    db.collection("otps").document(body.email).delete()

    return {"message": "Password reset successful"}


# ─── Change Password ────────────────────────────────────────
def change_password(body: ChangePasswordRequest, user_id: str) -> dict:
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user = user_doc.to_dict()

    if not verify_password(body.old_password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Old password is incorrect",
        )

    db.collection("users").document(user_id).update({
        "password": hash_password(body.new_password)
    })

    return {"message": "Password changed successfully"}


# ─── Google Auth ────────────────────────────────────────────
GOOGLE_OAUTH_CLIENT_IDS = [
    "994736565413-ovpisjfct483lp4ltlm2a8moltqdh3uf.apps.googleusercontent.com",  # Web
    "994736565413-aft3m0ggnds9bajhed8e7hor1h45bnhs.apps.googleusercontent.com",  # Android
]


def _decode_google_or_firebase_token(token: str) -> dict:
    # Try Firebase ID token first
    try:
        return firebase_auth.verify_id_token(token, clock_skew_seconds=10)
    except Exception as firebase_err:
        print("Not a Firebase ID token:", str(firebase_err))

    # Try Google OAuth ID token
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        request = google_requests.Request()
        last_error = None
        for audience in GOOGLE_OAUTH_CLIENT_IDS:
            try:
                return google_id_token.verify_oauth2_token(token, request, audience)
            except Exception as e:
                last_error = e
                continue
        raise last_error or ValueError("Google token audience mismatch")
    except Exception as google_err:
        print("Google token error:", str(google_err))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {google_err}",
        )


def google_login(id_token: str) -> dict:
    decoded = _decode_google_or_firebase_token(id_token)

    email = decoded.get("email")
    full_name = decoded.get("name", "")
    profile_image = decoded.get("picture", "")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account did not provide an email",
        )

    docs = db.collection("users").where("email", "==", email).limit(1).get()

    if docs:
        user_doc = docs[0]
        user_id = user_doc.id
        user = user_doc.to_dict()
    else:
        user = {
            "full_name": full_name,
            "email": email,
            "password": "",
            "role": "user",
            "phone": "",
            "profile_image": profile_image,
            "created_at": datetime.utcnow().isoformat(),
        }
        doc_ref = db.collection("users").add(user)
        user_id = doc_ref[1].id

    user_role = _normalize_role(user.get("role"))

    token = create_access_token({
        "sub": user_id,
        "email": email,
        "role": user_role,
    })
    refresh_token = create_refresh_token({"sub": user_id, "email": email})

    return {
        "message": "Login successful",
        "token": token,
        "refresh_token": refresh_token,
        "user": {
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "role": user_role,
            "phone": user.get("phone", ""),
            "profile_image": profile_image,
        },
    }


# ─── Get Current User ───────────────────────────────────────
def get_current_user_profile(user_id: str) -> dict:
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user = user_doc.to_dict()
    user.pop("password", None)

    return {
        "user": {
            "id": user_id,
            **user,
        }
    }


# ─── Update Current User ────────────────────────────────────
def update_current_user_profile(body: UpdateProfileRequest, user_id: str) -> dict:
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = {
        "full_name": body.full_name,
        "phone": body.phone or "",
        "profile_image": body.profile_image or "",
    }

    db.collection("users").document(user_id).update(update_data)

    updated_doc = db.collection("users").document(user_id).get()
    user = updated_doc.to_dict()
    user.pop("password", None)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user_id,
            **user,
        },
    }


# ─── Refresh Token ──────────────────────────────────────────
def refresh_access_token(refresh_token: str) -> dict:
    payload = verify_token(refresh_token, token_type="refresh")
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )

    user = user_doc.to_dict()
    user_role = _normalize_role(user.get("role"))

    new_token = create_access_token({
        "sub": user_id,
        "email": email,
        "role": user_role,
    })
    new_refresh_token = create_refresh_token({"sub": user_id, "email": email})

    return {
        "token": new_token,
        "refresh_token": new_refresh_token,
    }