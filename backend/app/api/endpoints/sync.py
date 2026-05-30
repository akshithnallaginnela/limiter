from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ...database import get_db
from ... import models, schemas
import datetime

router = APIRouter()

@router.post("/{user_id}", response_model=schemas.SyncResponse)
def sync_user_data(user_id: str, payload: schemas.SyncRequest, db: Session = Depends(get_db)):
    """
    Sync conversations and messages collected by Chrome Extension to Postgres Database.
    We upsert conversations and insert new messages.
    """
    # Check profile
    profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Call /profile first.")

    conv_count = 0
    msg_count = 0

    for conv_in in payload.conversations:
        # Upsert Conversation
        db_conv = db.query(models.Conversation).filter(
            models.Conversation.user_id == user_id,
            models.Conversation.external_conv_id == conv_in.external_conv_id,
            models.Conversation.platform == conv_in.platform
        ).first()

        if not db_conv:
            db_conv = models.Conversation(
                user_id=user_id,
                external_conv_id=conv_in.external_conv_id,
                platform=conv_in.platform,
                title=conv_in.title or f"Chat on {conv_in.platform}"
            )
            db.add(db_conv)
            db.flush()  # populate db_conv.id
            conv_count += 1
        else:
            if conv_in.title and db_conv.title != conv_in.title:
                db_conv.title = conv_in.title
                db_conv.updated_at = datetime.datetime.utcnow()
                db.flush()

        # Sync messages
        # Fetch existing messages count for this conversation
        existing_msg_count = db.query(models.Message).filter(
            models.Message.conversation_id == db_conv.id
        ).count()

        # Since messages are sent in order, if payload has more messages, we append the difference
        new_messages = conv_in.messages[existing_msg_count:]
        for msg_in in new_messages:
            db_msg = models.Message(
                conversation_id=db_conv.id,
                role=msg_in.role,
                content_length=msg_in.content_length,
                estimated_tokens=msg_in.estimated_tokens,
                created_at=msg_in.created_at
            )
            db.add(db_msg)
            msg_count += 1

            # Update daily usage analytics aggregation
            msg_date = msg_in.created_at.date()
            db_analytics = db.query(models.UsageAnalytics).filter(
                models.UsageAnalytics.user_id == user_id,
                models.UsageAnalytics.date == msg_date,
                models.UsageAnalytics.platform == conv_in.platform
            ).first()

            is_input = (msg_in.role == "user")
            token_in = msg_in.estimated_tokens if is_input else 0
            token_out = 0 if is_input else msg_in.estimated_tokens

            if not db_analytics:
                db_analytics = models.UsageAnalytics(
                    user_id=user_id,
                    date=msg_date,
                    platform=conv_in.platform,
                    tokens_input=token_in,
                    tokens_output=token_out,
                    message_count=1,
                    conversation_count=1 if existing_msg_count == 0 else 0
                )
                db.add(db_analytics)
            else:
                db_analytics.tokens_input += token_in
                db_analytics.tokens_output += token_out
                db_analytics.message_count += 1
                if existing_msg_count == 0 and len(new_messages) == len(conv_in.messages):
                    db_analytics.conversation_count += 1

    db.commit()

    return schemas.SyncResponse(
        success=True,
        synced_conversations=conv_count,
        synced_messages=msg_count
    )
