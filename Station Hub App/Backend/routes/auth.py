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
async def register(body: RegisterRequest):
    return await auth_service.register_user(body)


@router.post("/login")
async def login(body: LoginRequest):
    return await auth_service.login_user(body)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    return await auth_service.forgot_password(body)


@router.post("/verify-otp")
async def verify_otp(body: VerifyOTPRequest):
    return await auth_service.verify_otp(body)


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    return await auth_service.reset_password(body)


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    return await auth_service.change_password(body, current_user["sub"])

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return await auth_service.get_current_user_profile(current_user["sub"])


@router.put("/me")
async def update_me(body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    return await auth_service.update_current_user_profile(body, current_user["sub"])


@router.post("/google")
async def google_login(body: GoogleLoginRequest):
    return await auth_service.google_login(body.id_token)


@router.post("/refresh")
async def refresh_token(body: RefreshTokenRequest):
    return await auth_service.refresh_access_token(body.refresh_token)
