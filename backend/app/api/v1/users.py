from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.security import current_user
from app.db.session import get_db
from app.db import models
from app import schemas

router = APIRouter()


@router.get("/{user_id}/settings", response_model=schemas.UserSettingsOut)
def get_user_settings(
    user_id: UUID,
    current_user_obj: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Get user settings."""
    # Ensure user can only access their own settings
    if str(current_user_obj.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access these settings"
        )

    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == user_id
    ).first()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User settings not found"
        )

    return schemas.UserSettingsOut.model_validate(settings)


@router.put("/{user_id}/settings", response_model=schemas.UserSettingsOut)
def update_user_settings(
    user_id: UUID,
    body: schemas.UserSettingsUpdate,
    current_user_obj: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Update or create user settings."""
    # Ensure user can only update their own settings
    if str(current_user_obj.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update these settings"
        )

    # Get or create settings
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == user_id
    ).first()

    if not settings:
        # Create new settings
        settings = models.UserSettings(
            user_id=user_id,
            base_unit=body.base_unit or 50.0,
            default_book_id=body.default_book_id
        )
        db.add(settings)
    else:
        # Update existing settings
        if body.base_unit is not None:
            settings.base_unit = body.base_unit
        if body.default_book_id is not None:
            settings.default_book_id = body.default_book_id

    db.commit()
    db.refresh(settings)

    return schemas.UserSettingsOut.model_validate(settings)
