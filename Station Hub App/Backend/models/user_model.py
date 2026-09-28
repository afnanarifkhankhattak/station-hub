from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class UserModel:
    full_name: str
    email: str
    password: str
    role: str = "user"
    phone: str = ""
    profile_image: str = ""
    agreed_to_privacy_policy: bool = False
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return {
            "full_name": self.full_name,
            "email": self.email,
            "password": self.password,
            "role": self.role,
            "phone": self.phone,
            "profile_image": self.profile_image,
            "agreed_to_privacy_policy": self.agreed_to_privacy_policy,
            "created_at": self.created_at,
        }
