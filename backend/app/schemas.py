import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

# Profile Schemas
class ProfileBase(BaseModel):
    email: str

class ProfileCreate(ProfileBase):
    id: str  # Matches Supabase Auth user ID

class ProfileResponse(ProfileBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    platform: str
    daily_token_limit: int
    daily_message_limit: Optional[int] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    daily_token_limit: Optional[int] = None
    daily_message_limit: Optional[int] = None

class BudgetResponse(BudgetBase):
    id: int
    user_id: str
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Message Sync Schemas
class MessageSync(BaseModel):
    role: str
    content_length: int
    estimated_tokens: int
    created_at: datetime.datetime

# Conversation Sync Schemas
class ConversationSync(BaseModel):
    external_conv_id: str
    platform: str
    title: Optional[str] = None
    messages: List[MessageSync]

class SyncRequest(BaseModel):
    conversations: List[ConversationSync]

class SyncResponse(BaseModel):
    success: bool
    synced_conversations: int
    synced_messages: int

# Analytics Schemas
class DailyUsageSummary(BaseModel):
    date: datetime.date
    platform: str
    tokens_input: int
    tokens_output: int
    message_count: int
    conversation_count: int

class GeneralAnalytics(BaseModel):
    total_messages: int
    total_conversations: int
    total_tokens: int
    most_active_platform: str
    most_active_conversation_title: Optional[str]
    burn_rate_tokens_per_hour: float
    predicted_daily_usage: float
    estimated_exhaustion_hours: float
    efficiency_score: int
    efficiency_suggestions: List[str]

# Settings Schemas
class UserSettingsBase(BaseModel):
    sync_enabled: bool
    alert_thresholds: List[int]
    notifications_enabled: bool

class UserSettingsResponse(BaseModel):
    user_id: str
    sync_enabled: bool
    alert_thresholds: List[int]
    notifications_enabled: bool
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
