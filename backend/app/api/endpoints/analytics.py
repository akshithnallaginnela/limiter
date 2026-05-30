from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ...database import get_db
from ... import models, schemas
import datetime
from typing import List, Dict

router = APIRouter()

@router.get("/{user_id}", response_model=schemas.GeneralAnalytics)
def get_analytics(user_id: str, db: Session = Depends(get_db)):
    """
    Get aggregated usage analytics, burn rates, prompt efficiency scores, and productivity insights.
    """
    profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # 1. Base aggregations
    total_tokens = db.query(func.sum(models.Message.estimated_tokens)).join(models.Conversation).filter(
        models.Conversation.user_id == user_id
    ).scalar() or 0

    total_messages = db.query(models.Message).join(models.Conversation).filter(
        models.Conversation.user_id == user_id
    ).count()

    total_conversations = db.query(models.Conversation).filter(
        models.Conversation.user_id == user_id
    ).count()

    # Most active platform
    active_platform_row = db.query(
        models.Conversation.platform, func.count(models.Conversation.id).label("cnt")
    ).filter(
        models.Conversation.user_id == user_id
    ).group_by(models.Conversation.platform).order_by(func.count(models.Conversation.id).desc()).first()

    most_active_platform = active_platform_row[0] if active_platform_row else "None"

    # Most active conversation (longest message count)
    active_conv_row = db.query(
        models.Conversation.title, func.count(models.Message.id).label("cnt")
    ).join(models.Message).filter(
        models.Conversation.user_id == user_id
    ).group_by(models.Conversation.id).order_by(func.count(models.Message.id).desc()).first()

    most_active_conversation_title = active_conv_row[0] if active_conv_row else "None"

    # 2. Burn Rate Engine calculations
    # Token burn rate over the last 24 hours of activity
    day_ago = datetime.datetime.utcnow() - datetime.timedelta(days=1)
    recent_tokens = db.query(func.sum(models.Message.estimated_tokens)).join(models.Conversation).filter(
        models.Conversation.user_id == user_id,
        models.Message.created_at >= day_ago
    ).scalar() or 0

    burn_rate_tokens_per_hour = round(recent_tokens / 24.0, 1)
    predicted_daily_usage = recent_tokens

    # Check budget for remaining time
    budget = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.platform == "all"
    ).first()
    daily_limit = budget.daily_token_limit if budget else 100000

    # Calculate tokens used today (UTC)
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tokens_used_today = db.query(func.sum(models.Message.estimated_tokens)).join(models.Conversation).filter(
        models.Conversation.user_id == user_id,
        models.Message.created_at >= today_start
    ).scalar() or 0

    remaining_tokens = max(0, daily_limit - tokens_used_today)
    if burn_rate_tokens_per_hour > 0:
        estimated_exhaustion_hours = round(remaining_tokens / burn_rate_tokens_per_hour, 1)
    else:
        estimated_exhaustion_hours = 24.0

    # 3. Prompt Efficiency Engine (0-100 Score)
    efficiency_score = 100
    suggestions = []

    # Get user queries (role = 'user')
    user_messages = db.query(models.Message).join(models.Conversation).filter(
        models.Conversation.user_id == user_id,
        models.Message.role == "user"
    ).all()

    if len(user_messages) > 0:
        # Check Average prompt length
        avg_len = sum(m.content_length for m in user_messages) / len(user_messages)
        if avg_len < 30:
            efficiency_score -= 15
            suggestions.append("Your prompts are very short. Provide more detailed context to get higher quality answers in fewer turns.")
        elif avg_len > 4000:
            efficiency_score -= 10
            suggestions.append("Your prompts are very long. Consider splitting complex requests into smaller, incremental chunks.")

        # Check conversation expansion rate (average messages per conversation)
        avg_msgs_per_conv = total_messages / max(1, total_conversations)
        if avg_msgs_per_conv > 15:
            efficiency_score -= 15
            suggestions.append("You have very long chat threads. Starting fresh chats instead of continuing long threads saves input tokens and prevents slow responses.")
        elif avg_msgs_per_conv < 2:
            efficiency_score -= 10
            suggestions.append("You frequently create single-message threads. Reusing active chats for follow-ups can keep relevant context.")

        # Message frequency (if user sends multiple messages in a very short window)
        # We check messages that are close in timestamp (<30 seconds)
        timestamps = sorted([m.created_at for m in user_messages])
        rapid_fires = 0
        for i in range(1, len(timestamps)):
            diff = (timestamps[i] - timestamps[i-1]).total_seconds()
            if diff < 30:
                rapid_fires += 1
        
        rapid_fire_ratio = rapid_fires / len(timestamps)
        if rapid_fire_ratio > 0.2:
            efficiency_score -= 15
            suggestions.append("Avoid sending messages in rapid succession. Take time to read response outputs completely before typing follow-ups.")
    else:
        suggestions.append("Send a few prompts to start generating your personalized efficiency profile.")

    efficiency_score = max(10, min(100, efficiency_score))

    return schemas.GeneralAnalytics(
        total_messages=total_messages,
        total_conversations=total_conversations,
        total_tokens=total_tokens,
        most_active_platform=most_active_platform,
        most_active_conversation_title=most_active_conversation_title,
        burn_rate_tokens_per_hour=burn_rate_tokens_per_hour,
        predicted_daily_usage=predicted_daily_usage,
        estimated_exhaustion_hours=estimated_exhaustion_hours,
        efficiency_score=efficiency_score,
        efficiency_suggestions=suggestions
    )

@router.get("/{user_id}/charts", response_model=List[schemas.DailyUsageSummary])
def get_chart_data(user_id: str, db: Session = Depends(get_db)):
    """
    Retrieve aggregated history of daily token consumption grouped by platform for charts.
    """
    analytics_records = db.query(models.UsageAnalytics).filter(
        models.UsageAnalytics.user_id == user_id
    ).order_by(models.UsageAnalytics.date.asc()).all()

    # Map database objects to schemas
    return [
        schemas.DailyUsageSummary(
            date=record.date,
            platform=record.platform,
            tokens_input=record.tokens_input,
            tokens_output=record.tokens_output,
            message_count=record.message_count,
            conversation_count=record.conversation_count
        )
        for record in analytics_records
    ]
