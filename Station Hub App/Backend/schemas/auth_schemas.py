from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=3, max_length=150)
    email: EmailStr = Field()
    password: str
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    full_name: str
    phone: str | None = None
    profile_image: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str