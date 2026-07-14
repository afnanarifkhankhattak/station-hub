from fastapi import APIRouter, Depends, UploadFile, File
from middleware.auth_middleware import get_current_user
from schemas.profile_schemas import UpdateProfileRequest, PrivacyAgreementRequest
import services.profile_service as profile_service

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/")
def get_profile(current_user: dict = Depends(get_current_user)):
    return profile_service.get_profile(current_user["sub"])


@router.put("/")
def update_profile(body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    return profile_service.update_profile(body, current_user["sub"])

@router.put("/privacy-agreement")
def update_privacy_agreement(body: PrivacyAgreementRequest, current_user: dict = Depends(get_current_user)):
    return profile_service.update_privacy_agreement(body.agreed, current_user["sub"])


@router.delete("/")
def delete_account(current_user: dict = Depends(get_current_user)):
    return profile_service.delete_account(current_user["sub"])


@router.post("/upload-avatar")
def upload_avatar(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    return profile_service.upload_avatar(file, current_user["sub"])

@router.put("/push-token")
def update_push_token(body: dict, current_user: dict = Depends(get_current_user)):
    return profile_service.update_push_token(body.get("push_token"), current_user["sub"])

