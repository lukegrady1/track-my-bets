"""Groups API endpoints for social competition."""
import secrets
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, desc
from app.db.session import get_db
from app.core.security import current_user
from app.db import models
from app import schemas

router = APIRouter()


def generate_invite_code() -> str:
    """Generate a unique invite code."""
    return secrets.token_urlsafe(6)


@router.post("/", response_model=schemas.GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    body: schemas.GroupCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(current_user)
):
    """Create a new group."""
    # Generate unique invite code
    invite_code = generate_invite_code()
    while db.query(models.Group).filter(models.Group.invite_code == invite_code).first():
        invite_code = generate_invite_code()

    # Create group
    group = models.Group(
        name=body.name,
        description=body.description,
        owner_id=user.id,
        invite_code=invite_code
    )
    db.add(group)
    db.flush()

    # Add owner as first member
    member = models.GroupMember(
        group_id=group.id,
        user_id=user.id
    )
    db.add(member)
    db.commit()
    db.refresh(group)

    # Return group with member count
    result = schemas.GroupOut.model_validate(group)
    result.member_count = 1
    return result


@router.post("/join", response_model=schemas.GroupOut)
def join_group(
    body: schemas.GroupJoin,
    db: Session = Depends(get_db),
    user: models.User = Depends(current_user)
):
    """Join a group using invite code."""
    # Find group by invite code
    group = db.query(models.Group).filter(
        models.Group.invite_code == body.invite_code
    ).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found with that invite code"
        )

    # Check if already a member
    existing = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group.id,
        models.GroupMember.user_id == user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this group"
        )

    # Add as member
    member = models.GroupMember(
        group_id=group.id,
        user_id=user.id
    )
    db.add(member)
    db.commit()

    # Get member count
    member_count = db.query(func.count(models.GroupMember.user_id)).filter(
        models.GroupMember.group_id == group.id
    ).scalar()

    result = schemas.GroupOut.model_validate(group)
    result.member_count = member_count
    return result


@router.get("/", response_model=list[schemas.GroupOut])
def list_groups(
    db: Session = Depends(get_db),
    user: models.User = Depends(current_user)
):
    """List all groups user belongs to."""
    # Get groups where user is a member
    memberships = db.query(models.GroupMember).filter(
        models.GroupMember.user_id == user.id
    ).all()

    group_ids = [m.group_id for m in memberships]

    if not group_ids:
        return []

    # Get groups with member counts
    groups = db.query(
        models.Group,
        func.count(models.GroupMember.user_id).label('member_count')
    ).join(
        models.GroupMember
    ).filter(
        models.Group.id.in_(group_ids)
    ).group_by(
        models.Group.id
    ).all()

    results = []
    for group, member_count in groups:
        result = schemas.GroupOut.model_validate(group)
        result.member_count = member_count
        results.append(result)

    return results


@router.get("/{group_id}", response_model=schemas.GroupDetailOut)
def get_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    user: models.User = Depends(current_user)
):
    """Get group details with members."""
    # Check if user is a member
    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )

    # Get group
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Get all members with user details
    members = db.query(
        models.GroupMember,
        models.User
    ).join(
        models.User,
        models.GroupMember.user_id == models.User.id
    ).filter(
        models.GroupMember.group_id == group_id
    ).all()

    member_list = []
    for membership, user_obj in members:
        member_list.append(schemas.GroupMemberOut(
            user_id=user_obj.id,
            email=user_obj.email,
            joined_at=membership.joined_at
        ))

    result = schemas.GroupDetailOut.model_validate(group)
    result.member_count = len(member_list)
    result.members = member_list

    return result


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def leave_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    user: models.User = Depends(current_user)
):
    """Leave a group (or delete if owner)."""
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # If owner, delete entire group
    if group.owner_id == user.id:
        db.delete(group)
        db.commit()
        return

    # Otherwise, remove membership
    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )

    db.delete(membership)
    db.commit()


@router.get("/{group_id}/leaderboard", response_model=schemas.LeaderboardResponse)
def get_leaderboard(
    group_id: UUID,
    month: str | None = None,  # Format: YYYY-MM
    db: Session = Depends(get_db),
    user: models.User = Depends(current_user)
):
    """Get group leaderboard for a given month."""
    # Check if user is a member
    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )

    # Get group
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Default to current month
    if not month:
        month = datetime.utcnow().strftime("%Y-%m")

    # Calculate stats for each member for this month
    # Join bets, group by user, calculate metrics
    from sqlalchemy import func, and_

    stats = db.query(
        models.User.id.label('user_id'),
        models.User.email,
        func.count(models.Bet.id).label('total_bets'),
        func.sum(
            case((models.Bet.status == 'Won', 1), else_=0)
        ).label('wins'),
        func.sum(
            case((models.Bet.status == 'Lost', 1), else_=0)
        ).label('losses'),
        func.sum(models.Bet.result_profit).label('pnl'),
        func.sum(
            case(
                ((models.Bet.status.in_(['Won', 'Lost']), models.Bet.units)),
                else_=0
            )
        ).label('units'),
        func.sum(
            case(
                ((models.Bet.status.in_(['Won', 'Lost']), models.Bet.stake)),
                else_=0
            )
        ).label('total_stake')
    ).join(
        models.GroupMember,
        models.User.id == models.GroupMember.user_id
    ).outerjoin(
        models.Bet,
        and_(
            models.Bet.user_id == models.User.id,
            func.to_char(models.Bet.placed_at, 'YYYY-MM') == month
        )
    ).filter(
        models.GroupMember.group_id == group_id
    ).group_by(
        models.User.id,
        models.User.email
    ).all()

    # Calculate ROI and win rate, then sort
    leaderboard = []
    for row in stats:
        total_stake = float(row.total_stake or 0)
        pnl = float(row.pnl or 0)
        wins = int(row.wins or 0)
        losses = int(row.losses or 0)
        total_decided = wins + losses

        roi = (pnl / total_stake * 100) if total_stake > 0 else 0.0
        win_rate = (wins / total_decided * 100) if total_decided > 0 else 0.0

        leaderboard.append({
            'user_id': row.user_id,
            'email': row.email,
            'roi': round(roi, 2),
            'units': round(float(row.units or 0), 2),
            'win_rate': round(win_rate, 2),
            'total_bets': int(row.total_bets or 0),
            'wins': wins,
            'losses': losses,
            'top_sport': None  # TODO: Calculate top sport
        })

    # Sort by ROI descending
    leaderboard.sort(key=lambda x: x['roi'], reverse=True)

    # Add ranks
    for i, entry in enumerate(leaderboard, start=1):
        entry['rank'] = i

    return schemas.LeaderboardResponse(
        group_id=group_id,
        group_name=group.name,
        month=month,
        leaderboard=[schemas.LeaderboardEntry(**entry) for entry in leaderboard]
    )
