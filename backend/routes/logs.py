"""Daily Log API routes for growth tracking."""
import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from database.models import DailyLog, User
from models import DailyLogCreate, DailyLogResponse
from services.llm import llm_service

router = APIRouter()


async def analyze_log_ai(log_data: DailyLogCreate) -> Dict[str, Any]:
    """Use AI to analyze daily log entries."""
    system_prompt = """你是一位专业的成长教练。请分析用户今天的成长记录，给出建设性反馈。

请严格以JSON格式返回：
{
    "completion_rate": 0-100之间的数字, 表示今日完成度评分,
    "analysis": "今日整体表现分析，100字以内，积极且有建设性",
    "highlights": ["今天做得好的地方，列出2-3点"],
    "improvements": ["可以改进的地方，列出1-2点"],
    "trend": "今日表现趋势：上升/平稳/需要加强",
    "tomorrow_suggestions": ["明天的建议行动，列出2-3条"],
    "weekly_goal_progress": "周目标进度评估",
    "encouragement": "一句温暖的鼓励的话"
}"""

    user_content = f"""今天的成长记录：
完成任务: {json.dumps(log_data.completed_tasks, ensure_ascii=False)}
学习时长: {log_data.learning_hours} 小时
代码行数: {log_data.code_lines} 行
阅读数量: {log_data.reading_count} 篇
备注: {log_data.notes or '无'}"""

    try:
        result = await llm_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_content,
            temperature=0.7,
        )
        return result
    except Exception as e:
        return {
            "completion_rate": 50,
            "analysis": f"AI分析暂时不可用: {str(e)}",
            "highlights": ["已记录今日成长"],
            "improvements": ["继续保持"],
            "trend": "平稳",
            "tomorrow_suggestions": ["继续加油"],
            "weekly_goal_progress": "记录中",
            "encouragement": "坚持就是胜利！",
        }


@router.post("", response_model=DailyLogResponse)
async def create_daily_log(
    user_id: str,
    log_data: DailyLogCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new daily log with AI analysis."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Run AI analysis
    ai_result = await analyze_log_ai(log_data)

    daily_log = DailyLog(
        user_id=user_id,
        log_date=log_data.log_date,
        completed_tasks=log_data.completed_tasks,
        learning_hours=log_data.learning_hours,
        code_lines=log_data.code_lines,
        reading_count=log_data.reading_count,
        notes=log_data.notes,
        ai_analysis=ai_result.get("analysis", ""),
        suggestions=json.dumps(ai_result.get("tomorrow_suggestions", []), ensure_ascii=False),
        completion_rate=ai_result.get("completion_rate", 0),
    )
    db.add(daily_log)
    await db.flush()
    await db.commit()
    await db.refresh(daily_log)

    return daily_log


@router.get("")
async def list_daily_logs(user_id: str, days: int = 30, db: AsyncSession = Depends(get_db)):
    """List daily logs for a user, default last 30 days."""
    result = await db.execute(
        select(DailyLog)
        .where(DailyLog.user_id == user_id)
        .order_by(DailyLog.log_date.desc())
        .limit(days)
    )
    logs = result.scalars().all()

    response_logs = []
    for log in logs:
        suggestions = []
        try:
            if isinstance(log.suggestions, str):
                suggestions = json.loads(log.suggestions)
            elif isinstance(log.suggestions, list):
                suggestions = log.suggestions
        except (json.JSONDecodeError, TypeError):
            suggestions = []

        response_logs.append({
            "id": log.id,
            "log_date": log.log_date,
            "completed_tasks": log.completed_tasks or [],
            "learning_hours": log.learning_hours or 0,
            "code_lines": log.code_lines or 0,
            "reading_count": log.reading_count or 0,
            "ai_analysis": log.ai_analysis,
            "suggestions": suggestions,
            "completion_rate": log.completion_rate or 0,
            "notes": log.notes,
            "created_at": log.created_at,
        })

    return response_logs


@router.get("/stats")
async def get_growth_stats(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get growth statistics for a user."""
    result = await db.execute(
        select(DailyLog).where(DailyLog.user_id == user_id).order_by(DailyLog.log_date.desc())
    )
    logs = result.scalars().all()

    if not logs:
        return {
            "total_days": 0,
            "total_learning_hours": 0,
            "total_code_lines": 0,
            "total_reading": 0,
            "avg_completion_rate": 0,
            "streak_days": 0,
        }

    total_hours = sum(log.learning_hours or 0 for log in logs)
    total_code = sum(log.code_lines or 0 for log in logs)
    total_reading = sum(log.reading_count or 0 for log in logs)
    avg_completion = sum(log.completion_rate or 0 for log in logs) / len(logs)

    # Calculate streak (consecutive days)
    from datetime import datetime, timedelta
    dates = sorted([log.log_date for log in logs], reverse=True)
    streak = 0
    expected_date = datetime.now().date()

    for date_str in dates:
        try:
            log_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            if log_date == expected_date or log_date == expected_date - timedelta(days=1 if streak > 0 else 0):
                streak += 1
                expected_date = log_date
            else:
                break
        except ValueError:
            continue

    return {
        "total_days": len(logs),
        "total_learning_hours": round(total_hours, 1),
        "total_code_lines": total_code,
        "total_reading": total_reading,
        "avg_completion_rate": round(avg_completion, 1),
        "streak_days": streak,
        "recent_logs": [
            {
                "date": log.log_date,
                "completion_rate": log.completion_rate,
                "learning_hours": log.learning_hours,
            }
            for log in logs[:7]
        ],
    }
