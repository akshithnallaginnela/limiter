from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...database import get_db
from ... import models, schemas

router = APIRouter()

@router.post("/profile", response_model=schemas.ProfileResponse)
def get_or_create_profile(profile_in: schemas.ProfileCreate, db: Session = Depends(get_db)):
    """
    Ensure the user profile exists in the local PostgreSQL DB (synced from Supabase Auth).
    """
    db_profile = db.query(models.Profile).filter(models.Profile.id == profile_in.id).first()
    if not db_profile:
        db_profile = models.Profile(
            id=profile_in.id,
            email=profile_in.email
        )
        db.add(db_profile)
        
        # Create default budget limits
        default_platforms = ["all", "chatgpt", "claude", "gemini", "grok", "perplexity"]
        for platform in default_platforms:
            db_budget = models.Budget(
                user_id=profile_in.id,
                platform=platform,
                daily_token_limit=100000 if platform == "all" else 30000,
                daily_message_limit=100 if platform == "all" else 40
            )
            db.add(db_budget)
            
        # Create default settings
        db_settings = models.UserSettings(
            user_id=profile_in.id,
            sync_enabled=1,
            alert_thresholds="50,75,90,100",
            notifications_enabled=1
        )
        db.add(db_settings)
        
        db.commit()
        db.refresh(db_profile)
    return db_profile
