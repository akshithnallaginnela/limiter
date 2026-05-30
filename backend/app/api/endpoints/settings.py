from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...database import get_db
from ... import models, schemas
import datetime
from typing import List

router = APIRouter()

@router.get("/{user_id}/budget", response_model=List[schemas.BudgetResponse])
def get_budgets(user_id: str, db: Session = Depends(get_db)):
    """
    Get daily budgets configured for each platform.
    """
    budgets = db.query(models.Budget).filter(models.Budget.user_id == user_id).all()
    return budgets

@router.post("/{user_id}/budget", response_model=schemas.BudgetResponse)
def update_budget(user_id: str, budget_in: schemas.BudgetCreate, db: Session = Depends(get_db)):
    """
    Update or create a daily token budget for a platform.
    """
    db_budget = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.platform == budget_in.platform
    ).first()

    if not db_budget:
        db_budget = models.Budget(
            user_id=user_id,
            platform=budget_in.platform,
            daily_token_limit=budget_in.daily_token_limit,
            daily_message_limit=budget_in.daily_message_limit
        )
        db.add(db_budget)
    else:
        db_budget.daily_token_limit = budget_in.daily_token_limit
        if budget_in.daily_message_limit is not None:
            db_budget.daily_message_limit = budget_in.daily_message_limit
        db_budget.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/{user_id}/settings", response_model=schemas.UserSettingsResponse)
def get_settings(user_id: str, db: Session = Depends(get_db)):
    """
    Get user notification alerts and sync preferences.
    """
    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if not settings:
        # Lazy provision default settings
        settings = models.UserSettings(
            user_id=user_id,
            sync_enabled=1,
            alert_thresholds="50,75,90,100",
            notifications_enabled=1
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Convert alert_thresholds string back to list of integers
    thresholds_list = [int(x) for x in settings.alert_thresholds.split(",") if x.strip()]
    
    return schemas.UserSettingsResponse(
        user_id=settings.user_id,
        sync_enabled=bool(settings.sync_enabled),
        alert_thresholds=thresholds_list,
        notifications_enabled=bool(settings.notifications_enabled),
        updated_at=settings.updated_at
    )

@router.post("/{user_id}/settings", response_model=schemas.UserSettingsResponse)
def update_settings(user_id: str, settings_in: schemas.UserSettingsBase, db: Session = Depends(get_db)):
    """
    Save notification alerts and sync settings.
    """
    db_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if not db_settings:
        db_settings = models.UserSettings(user_id=user_id)
        db.add(db_settings)

    db_settings.sync_enabled = 1 if settings_in.sync_enabled else 0
    db_settings.notifications_enabled = 1 if settings_in.notifications_enabled else 0
    # Store thresholds as sorted comma-separated string
    sorted_thresholds = sorted(settings_in.alert_thresholds)
    db_settings.alert_thresholds = ",".join(str(x) for x in sorted_thresholds)
    db_settings.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(db_settings)

    thresholds_list = [int(x) for x in db_settings.alert_thresholds.split(",") if x.strip()]

    return schemas.UserSettingsResponse(
        user_id=db_settings.user_id,
        sync_enabled=bool(db_settings.sync_enabled),
        alert_thresholds=thresholds_list,
        notifications_enabled=bool(db_settings.notifications_enabled),
        updated_at=db_settings.updated_at
    )
