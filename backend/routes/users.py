"""User API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from database.models import User, UserProfile
from models import UserCreate, UserResponse, UserProfileCreate

router = APIRouter()


@router.post("", response_model=UserResponse)
async def create_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user with optional profile."""
    user = User(
        name=user_data.name,
        email=user_data.email,
    )
    db.add(user)
    await db.flush()

    if user_data.profile:
        profile = UserProfile(
            user_id=user.id,
            **user_data.profile.model_dump(exclude_none=True)
        )
        db.add(profile)

    await db.flush()
    await db.refresh(user)

    # Load profile for response
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    user.profile = result.scalar_one_or_none()

    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get user by ID."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    user.profile = result.scalar_one_or_none()

    return user


@router.put("/{user_id}/profile", response_model=UserResponse)
async def update_user_profile(
    user_id: str,
    profile_data: UserProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update or create user profile."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()

    if profile:
        for key, value in profile_data.model_dump(exclude_none=True).items():
            setattr(profile, key, value)
    else:
        profile = UserProfile(
            user_id=user_id,
            **profile_data.model_dump(exclude_none=True)
        )
        db.add(profile)

    await db.flush()
    await db.refresh(user)
    user.profile = profile

    return user
