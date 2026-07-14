from fastapi import HTTPException, status, UploadFile
from config.firebase import db
from schemas.profile_schemas import UpdateProfileRequest, PrivacyAgreementRequest
import base64


def get_profile(user_id: str) -> dict:
    doc = db.collection("users").document(user_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user = doc.to_dict()
    user.pop("password", None)

    return {"user": {"id": user_id, **user}}


def update_profile(body: UpdateProfileRequest, user_id: str) -> dict:
    user_ref = db.collection("users").document(user_id)

    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided")

    user_ref.update(update_data)

    return {"message": "Profile updated successfully"}


def update_privacy_agreement(agreed: bool, user_id: str) -> dict:
    user_ref = db.collection("users").document(user_id)

    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_ref.update({"agreed_to_privacy_policy": agreed})

    return {"agreed_to_privacy_policy": agreed, "message": "Privacy agreement updated successfully"}


def delete_account(user_id: str) -> dict:
    user_ref = db.collection("users").document(user_id)

    if not user_ref.get().exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user_ref.delete()

    return {"message": "Account deleted successfully"}


def upload_avatar(file: UploadFile, user_id: str) -> dict:
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WEBP, or GIF images allowed")

    # Read and check size (max 1MB for Firestore storage)
    contents = file.file.read()
    if len(contents) > 1 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 1MB")

    # Convert to base64 data URL
    b64 = base64.b64encode(contents).decode("utf-8")
    avatar_url = f"data:{file.content_type};base64,{b64}"

    # Save to Firestore
    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_ref.update({"profile_image": avatar_url})

    return {"avatar_url": avatar_url, "message": "Avatar uploaded successfully"}

def update_push_token(push_token: str, user_id: str) -> dict:
    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_ref.update({"push_token": push_token})
    return {"message": "Push token saved"}