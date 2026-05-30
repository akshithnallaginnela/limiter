import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, index=True)  # Links to Supabase auth.users.id
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("UsageAnalytics", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", cascade="all, delete-orphan")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String, nullable=False)  # 'all', 'chatgpt', 'claude', 'gemini', 'grok', 'perplexity'
    daily_token_limit = Column(Integer, default=100000, nullable=False)
    daily_message_limit = Column(Integer, default=100, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("Profile", back_populates="budgets")

    __table_args__ = (UniqueConstraint('user_id', 'platform', name='uq_user_platform_budget'),)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    external_conv_id = Column(String, nullable=False)  # ID from the browser (e.g. Chat ID)
    platform = Column(String, nullable=False)  # 'chatgpt', 'claude', 'gemini', etc.
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("Profile", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint('user_id', 'external_conv_id', 'platform', name='uq_user_conv_platform'),)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content_length = Column(Integer, nullable=False)  # Char count
    estimated_tokens = Column(Integer, nullable=False)  # Estimated tokens
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")

class UsageAnalytics(Base):
    __tablename__ = "usage_analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    platform = Column(String, nullable=False)  # 'chatgpt', 'claude', 'gemini', etc.
    tokens_input = Column(Integer, default=0, nullable=False)
    tokens_output = Column(Integer, default=0, nullable=False)
    message_count = Column(Integer, default=0, nullable=False)
    conversation_count = Column(Integer, default=0, nullable=False)

    user = relationship("Profile", back_populates="analytics")

    __table_args__ = (UniqueConstraint('user_id', 'date', 'platform', name='uq_user_date_platform'),)

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    sync_enabled = Column(Integer, default=1, nullable=False) # 1 = true, 0 = false
    alert_thresholds = Column(String, default="50,75,90,100", nullable=False) # comma-separated percentages
    notifications_enabled = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("Profile", back_populates="settings")
