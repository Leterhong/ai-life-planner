"""Pydantic models for API requests/responses."""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ============= User Models =============
class UserProfileCreate(BaseModel):
    age: Optional[int] = None
    education: Optional[str] = None
    major: Optional[str] = None
    current_job: Optional[str] = None
    industry: Optional[str] = None
    programming_skills: List[str] = Field(default_factory=list)
    language_skills: List[str] = Field(default_factory=list)
    professional_skills: List[str] = Field(default_factory=list)
    work_experience_years: float = 0
    interests: List[str] = Field(default_factory=list)
    career_goal: Optional[str] = None
    income_goal: Optional[str] = None
    learning_goal: Optional[str] = None
    life_goal: Optional[str] = None
    additional_info: Optional[str] = None


class UserCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    profile: Optional[UserProfileCreate] = None


class UserResponse(BaseModel):
    id: str
    name: Optional[str]
    email: Optional[str]
    profile: Optional[UserProfileCreate] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ============= Plan Models =============
class PlanCreateRequest(BaseModel):
    user_id: str


class AgentResultResponse(BaseModel):
    id: str
    agent_type: str
    agent_name: str
    content: Any
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PlanResponse(BaseModel):
    id: str
    user_id: str
    title: str
    status: str
    current_step: str
    progress_percent: int
    final_report: Optional[Any] = None
    agent_results: List[AgentResultResponse] = Field(default_factory=list)
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PlanProgressResponse(BaseModel):
    plan_id: str
    status: str
    current_step: str
    progress_percent: int
    agent_results: List[AgentResultResponse] = Field(default_factory=list)


# ============= Daily Log Models =============
class DailyLogCreate(BaseModel):
    log_date: str
    completed_tasks: List[str] = Field(default_factory=list)
    learning_hours: float = 0
    code_lines: int = 0
    reading_count: int = 0
    notes: Optional[str] = None


class DailyLogResponse(BaseModel):
    id: str
    log_date: str
    completed_tasks: List[str]
    learning_hours: float
    code_lines: int
    reading_count: int
    ai_analysis: Optional[str] = None
    suggestions: Optional[List[str]] = None  # Changed from str to List[str]
    completion_rate: float
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ============= File Upload Response =============
class FileUploadResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: str

    model_config = {"from_attributes": True}
