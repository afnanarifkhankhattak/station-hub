from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
from schemas.auth_schemas import GoogleLoginRequest  
from schemas.auth_schemas import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    UpdateProfileRequest,
    RefreshTokenRequest,
)
import services.auth_service as auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])



@router.post("/register")
def register(body: RegisterRequest):
    return auth_service.register_user(body)


@router.post("/login")
def login(body: LoginRequest):
    return auth_service.login_user(body)


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest):
    return auth_service.forgot_password(body)


@router.post("/verify-otp")
def verify_otp(body: VerifyOTPRequest):
    return auth_service.verify_otp(body)


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest):
    return auth_service.reset_password(body)


@router.post("/change-password")
def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    return auth_service.change_password(body, current_user["sub"])

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return auth_service.get_current_user_profile(current_user["sub"])


@router.put("/me")
def update_me(body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    return auth_service.update_current_user_profile(body, current_user["sub"])


@router.post("/google")
def google_login(body: GoogleLoginRequest):
    return auth_service.google_login(body.id_token)


@router.post("/refresh")
def refresh_token(body: RefreshTokenRequest):
    return auth_service.refresh_access_token(body.refresh_token)
