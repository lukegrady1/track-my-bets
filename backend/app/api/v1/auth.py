from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    current_user
)
from app.db.session import get_db
from app.db import models
from app import schemas

router = APIRouter()


@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: schemas.UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == body.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_pwd = hash_password(body.password)
    new_user = models.User(
        email=body.email,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.flush()  # Get user ID without committing

    # Create user settings with default values
    user_settings = models.UserSettings(
        user_id=new_user.id,
        base_unit=50.0  # Default base unit
    )
    db.add(user_settings)
    db.commit()
    db.refresh(new_user)

    # Generate tokens
    access_token = create_access_token(data={"sub": str(new_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})

    return schemas.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login and get access tokens."""
    # Find user by email
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Verify password
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return schemas.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    payload = decode_token(refresh_token)

    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Verify user still exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Generate new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return schemas.TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )


@router.get("/me", response_model=dict)
def get_current_user_info(user: models.User = Depends(current_user)):
    """Get current user profile and settings."""
    return {
        "user": schemas.UserOut.model_validate(user),
        "settings": schemas.UserSettingsOut.model_validate(user.settings) if user.settings else None
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(user: models.User = Depends(current_user)):
    """Logout user (client-side should clear tokens)."""
    return {"message": "Logged out successfully"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(body: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset (placeholder for future email functionality)."""
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a reset link has been sent"}

    # TODO: Implement email sending logic here
    return {"message": "If the email exists, a reset link has been sent"}


@router.patch("/settings", response_model=schemas.UserSettingsOut)
def update_user_settings(
    body: schemas.UserSettingsUpdate,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Update user settings."""
    if not user.settings:
        # Create settings if they don't exist
        settings = models.UserSettings(user_id=user.id)
        db.add(settings)
    else:
        settings = user.settings

    # Update fields
    if body.base_unit is not None:
        settings.base_unit = body.base_unit
    if body.default_book_id is not None:
        settings.default_book_id = body.default_book_id

    db.commit()
    db.refresh(settings)

    return schemas.UserSettingsOut.model_validate(settings)
