"""
Security Module
================
JWT token creation/validation and password hashing/verification.
Uses python-jose for JWT and passlib+bcrypt for passwords.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

# Patch passlib/bcrypt compatibility issue for modern bcrypt versions
import bcrypt
if not hasattr(bcrypt, "__about__"):
    class About:
        __version__ = bcrypt.__version__
    bcrypt.__about__ = About()

from jose import JWTError, jwt
from passlib.context import CryptContext

from backend.app.core.config import get_settings


# ── Password Hashing ────────────────────────────────────────────
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    return _pwd_context.verify(plain_password, hashed_password)


# ── JWT Token Creation ──────────────────────────────────────────
def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a short-lived JWT access token.
    
    Args:
        data: Payload dict (must include 'sub' for user identifier).
        expires_delta: Custom expiration. Defaults to JWT_ACCESS_EXPIRE_MINUTES.
    
    Returns:
        Encoded JWT string.
    """
    settings = get_settings()
    to_encode = data.copy()

    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    })

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(data: dict[str, Any]) -> str:
    """
    Create a long-lived JWT refresh token.
    
    Args:
        data: Payload dict (must include 'sub' for user identifier).
    
    Returns:
        Encoded JWT string.
    """
    settings = get_settings()
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    })

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: The JWT string.
    
    Returns:
        Decoded payload dict, or None if invalid/expired.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None
