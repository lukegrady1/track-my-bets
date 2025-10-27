from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.security import current_user
from app.db.session import get_db
from app.db import models
from app import schemas

router = APIRouter()


@router.get("/", response_model=list[schemas.SportsbookOut])
def list_sportsbooks(
    user_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(current_user)
):
    """List all sportsbooks (global + user's custom books)."""
    # Get global sportsbooks (user_id is NULL) and user's custom sportsbooks
    query = db.query(models.Sportsbook).filter(
        (models.Sportsbook.user_id.is_(None)) |
        (models.Sportsbook.user_id == current_user_obj.id)
    ).order_by(models.Sportsbook.name)

    sportsbooks = query.all()
    return [schemas.SportsbookOut.model_validate(book) for book in sportsbooks]


@router.post("/", response_model=schemas.SportsbookOut, status_code=status.HTTP_201_CREATED)
def create_sportsbook(
    body: schemas.SportsbookCreate,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Create a custom sportsbook for the user."""
    new_book = models.Sportsbook(
        name=body.name,
        user_id=user.id
    )

    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return schemas.SportsbookOut.model_validate(new_book)


@router.get("/{book_id}", response_model=schemas.SportsbookOut)
def get_sportsbook(
    book_id: UUID,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Get a specific sportsbook by ID."""
    book = db.query(models.Sportsbook).filter(
        models.Sportsbook.id == book_id,
        (models.Sportsbook.user_id.is_(None)) | (models.Sportsbook.user_id == user.id)
    ).first()

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sportsbook not found"
        )

    return schemas.SportsbookOut.model_validate(book)
