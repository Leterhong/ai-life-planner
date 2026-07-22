"""Plan API routes - fixed SQLite locking by storing results in memory during analysis."""
import asyncio
import json
import threading
import time
import traceback
import os
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from datetime import datetime
from sqlalchemy.orm import selectinload

from database.models import Plan, AgentResult, User
from models import PlanCreateRequest
from agents.orchestrator import orchestrator
from database.db import async_session

router = APIRouter()

# In-memory store - holds complete progress and results
plan_progress: Dict[str, Dict[str, Any]] = {}
# In-memory store for agent results while analysis is running
plan_agent_results: Dict[str, List[Dict[str, Any]]] = {}


def run_pipeline_in_thread(plan_id: str):
    """Run the full agent pipeline in a background thread.
    All agent results are stored in memory during execution to avoid DB locks.
    Database is written only once at the end."""
    log_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'agent_errors.log')

    def log(msg):
        try:
            os.makedirs(os.path.dirname(log_path), exist_ok=True)
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(f'[{datetime.now()}] {msg}\n')
        except Exception:
            pass

    # Custom callback that stores in memory AND stores agent results as they come
    agent_results_memory = []

    async def progress_cb(step: str, percent: int, message: str):
        plan_progress[plan_id] = {
            "status": "processing",
            "current_step": step,
            "progress_percent": percent,
            "message": message,
        }

    async def run():
        try:
            log(f"Starting pipeline for {plan_id}")
            final_report = None

            # We run the agents one by one, storing results in memory,
            # and only write to DB at the very end to avoid lock conflicts.
            from database.db import async_session
            from database.models import UserProfile, UploadedFile

            async with async_session() as db:
                plan = await db.get(Plan, plan_id)
                if not plan:
                    log(f"Plan {plan_id} not found")
                    plan_progress[plan_id] = {"status": "failed", "message": "Plan not found"}
                    return

                # Get user data
                user_id = plan.user_id
                profile = await db.get(UserProfile, user_id)
                user_profile_data = {}
                if profile:
                    user_profile_data = {
                        "age": profile.age,
                        "education": profile.education,
                        "major": profile.major,
                        "current_job": profile.current_job,
                        "industry": profile.industry,
                        "programming_skills": profile.programming_skills or [],
                        "language_skills": profile.language_skills or [],
                        "professional_skills": profile.professional_skills or [],
                        "work_experience_years": profile.work_experience_years or 0,
                        "interests": profile.interests or [],
                        "career_goal": profile.career_goal,
                        "income_goal": profile.income_goal,
                        "learning_goal": profile.learning_goal,
                        "life_goal": profile.life_goal,
                        "additional_info": profile.additional_info,
                    }

                # Get file contents
                file_result = await db.execute(
                    select(UploadedFile).where(
                        UploadedFile.user_id == user_id,
                        UploadedFile.status == "processed"
                    )
                )
                files = file_result.scalars().all()
                file_contents = "\n\n".join([f.content_text for f in files if f.content_text])[:50000]

                # Import agents
                from agents.career_agent import CareerAgent
                from agents.learning_agent import LearningAgent
                from agents.finance_agent import FinanceAgent
                from agents.risk_agent import RiskAgent
                from agents.master_agent import MasterAgent

                career_agent = CareerAgent()
                learning_agent = LearningAgent()
                finance_agent = FinanceAgent()
                risk_agent = RiskAgent()
                master_agent = MasterAgent()

                # Step 1: Career
                await progress_cb("career_analysis", 10, "职业规划专家分析中...")
                career_result = await career_agent.analyze(user_profile_data, file_contents)
                ar_career = AgentResult(
                    plan_id=plan_id,
                    agent_type="career",
                    agent_name=career_result["agent_name"],
                    content=json.dumps(career_result["content"], ensure_ascii=False),
                    status=career_result["status"],
                    completed_at=datetime.utcnow(),
                )
                agent_results_memory.append(ar_career)
                plan_agent_results[plan_id] = [
                    {"id": ar_career.id, "agent_type": "career", "agent_name": career_result["agent_name"],
                     "content": career_result["content"], "status": career_result["status"]}
                ]

                # Step 2: Learning
                await progress_cb("learning_analysis", 25, "学习成长导师规划中...")
                learning_result = await learning_agent.analyze(user_profile_data, file_contents)
                ar_learning = AgentResult(
                    plan_id=plan_id,
                    agent_type="learning",
                    agent_name=learning_result["agent_name"],
                    content=json.dumps(learning_result["content"], ensure_ascii=False),
                    status=learning_result["status"],
                    completed_at=datetime.utcnow(),
                )
                agent_results_memory.append(ar_learning)
                plan_agent_results[plan_id].append(
                    {"id": ar_learning.id, "agent_type": "learning", "agent_name": learning_result["agent_name"],
                     "content": learning_result["content"], "status": learning_result["status"]}
                )

                # Step 3: Finance
                await progress_cb("finance_analysis", 40, "财务规划专家评估中...")
                finance_result = await finance_agent.analyze(user_profile_data, file_contents)
                ar_finance = AgentResult(
                    plan_id=plan_id,
                    agent_type="finance",
                    agent_name=finance_result["agent_name"],
                    content=json.dumps(finance_result["content"], ensure_ascii=False),
                    status=finance_result["status"],
                    completed_at=datetime.utcnow(),
                )
                agent_results_memory.append(ar_finance)
                plan_agent_results[plan_id].append(
                    {"id": ar_finance.id, "agent_type": "finance", "agent_name": finance_result["agent_name"],
                     "content": finance_result["content"], "status": finance_result["status"]}
                )

                # Step 4: Risk - passes previous results
                await progress_cb("risk_analysis", 60, "风险专家审查中...")
                # Build context from previous agents - even failed ones for awareness
                prev_results_for_risk = {
                    "career": career_result,
                    "learning": learning_result,
                    "finance": finance_result,
                }
                file_contents_with_prev = file_contents + "\n\n## 前面专家的分析结果\n"
                for aname, ares in prev_results_for_risk.items():
                    status = "成功" if ares["status"] == "completed" else "失败"
                    file_contents_with_prev += f"\n### {ares['agent_name']}({status})\n"
                    if ares["status"] == "completed":
                        file_contents_with_prev += json.dumps(ares["content"], ensure_ascii=False)[:3000] + "\n"
                risk_result = await risk_agent.analyze(user_profile_data, file_contents_with_prev)
                ar_risk = AgentResult(
                    plan_id=plan_id,
                    agent_type="risk",
                    agent_name=risk_result["agent_name"],
                    content=json.dumps(risk_result["content"], ensure_ascii=False),
                    status=risk_result["status"],
                    completed_at=datetime.utcnow(),
                )
                agent_results_memory.append(ar_risk)
                plan_agent_results[plan_id].append(
                    {"id": ar_risk.id, "agent_type": "risk", "agent_name": risk_result["agent_name"],
                     "content": risk_result["content"], "status": risk_result["status"]}
                )

                # Step 5: Master - synthesizes all
                await progress_cb("master_synthesis", 80, "人生总规划师生成报告中...")
                all_prev = {
                    "career": career_result,
                    "learning": learning_result,
                    "finance": finance_result,
                    "risk": risk_result,
                }
                file_contents_for_master = file_contents + "\n\n## 所有专家的分析结果\n"
                for aname, ares in all_prev.items():
                    status = "成功" if ares["status"] == "completed" else "失败"
                    file_contents_for_master += f"\n### {ares['agent_name']}({status})\n"
                    if ares["status"] == "completed":
                        file_contents_for_master += json.dumps(ares["content"], ensure_ascii=False)[:3000] + "\n"
                    else:
                        file_contents_for_master += "该专家分析失败，请基于已有信息继续完成规划。\n"
                master_result = await master_agent.analyze(user_profile_data, file_contents_for_master)
                final_report = master_result["content"]
                ar_master = AgentResult(
                    plan_id=plan_id,
                    agent_type="master",
                    agent_name=master_result["agent_name"],
                    content=json.dumps(master_result["content"], ensure_ascii=False),
                    status=master_result["status"],
                    completed_at=datetime.utcnow(),
                )
                agent_results_memory.append(ar_master)
                plan_agent_results[plan_id].append(
                    {"id": ar_master.id, "agent_type": "master", "agent_name": master_result["agent_name"],
                     "content": master_result["content"], "status": master_result["status"]}
                )

                await progress_cb("master_synthesis", 95, "正在保存结果...")

                # Now write everything to DB in ONE transaction (avoid locks)
                plan.status = "completed"
                plan.current_step = "completed"
                plan.progress_percent = 100
                plan.final_report = final_report
                plan.completed_at = datetime.utcnow()
                for ar in agent_results_memory:
                    db.add(ar)
                await db.commit()

                plan_progress[plan_id] = {
                    "status": "completed",
                    "current_step": "completed",
                    "progress_percent": 100,
                    "message": "规划完成！",
                    "final_report": final_report,
                }
                log(f"Completed plan {plan_id}")

        except Exception as e:
            err = traceback.format_exc()
            log(f"Error: {err}")
            traceback.print_exc()
            plan_progress[plan_id] = {
                "status": "failed",
                "current_step": "error",
                "progress_percent": 0,
                "message": str(e),
            }

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(run())
    finally:
        loop.close()


@router.post("")
async def create_plan(request: PlanCreateRequest):
    """Create a plan and start background analysis."""
    async with async_session() as db:
        user = await db.get(User, request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        plan = Plan(
            user_id=request.user_id,
            title="我的未来五年成长规划",
            status="processing",
            current_step="starting",
            progress_percent=0,
        )
        db.add(plan)
        await db.commit()
        plan_id = plan.id

    # Initialize memory stores
    plan_progress[plan_id] = {
        "status": "processing",
        "current_step": "starting",
        "progress_percent": 0,
        "message": "正在初始化...",
    }
    plan_agent_results[plan_id] = []

    # Start background thread
    thread = threading.Thread(target=run_pipeline_in_thread, args=(plan_id,), daemon=True)
    thread.start()

    return {
        "id": plan_id,
        "user_id": request.user_id,
        "title": plan.title,
        "status": "processing",
        "current_step": "starting",
        "progress_percent": 0,
        "final_report": None,
        "agent_results": [],
        "created_at": plan.created_at,
        "completed_at": None,
    }


@router.get("")
async def list_plans(user_id: str):
    """List all plans for a user."""
    async with async_session() as db:
        result = await db.execute(
            select(Plan)
            .options(selectinload(Plan.agent_results))
            .where(Plan.user_id == user_id)
            .order_by(Plan.created_at.desc())
        )
        plans = result.scalars().all()
        response = []
        for plan in plans:
            ar_list = []
            for ar in plan.agent_results:
                try:
                    content = json.loads(ar.content) if isinstance(ar.content, str) else ar.content
                except Exception:
                    content = {"raw": ar.content}
                ar_list.append({
                    "id": ar.id, "agent_type": ar.agent_type, "agent_name": ar.agent_name,
                    "content": content, "status": ar.status,
                    "created_at": ar.created_at, "completed_at": ar.completed_at,
                })
            progress = plan_progress.get(plan.id)
            response.append({
                "id": plan.id, "user_id": plan.user_id, "title": plan.title,
                "status": progress.get("status", plan.status) if progress else plan.status,
                "current_step": progress.get("current_step", plan.current_step) if progress else plan.current_step,
                "progress_percent": progress.get("progress_percent", plan.progress_percent) if progress else plan.progress_percent,
                "final_report": plan.final_report or (progress.get("final_report") if progress else None),
                "agent_results": ar_list,
                "created_at": plan.created_at, "completed_at": plan.completed_at,
            })
        return response


@router.get("/{plan_id}")
async def get_plan(plan_id: str):
    """Get a plan by ID."""
    async with async_session() as db:
        result = await db.execute(
            select(Plan)
            .options(selectinload(Plan.agent_results))
            .where(Plan.id == plan_id)
        )
        plan = result.scalar_one_or_none()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        ar_list = []
        for ar in plan.agent_results:
            try:
                content = json.loads(ar.content) if isinstance(ar.content, str) else ar.content
            except Exception:
                content = {"raw": ar.content}
            ar_list.append({
                "id": ar.id, "agent_type": ar.agent_type, "agent_name": ar.agent_name,
                "content": content, "status": ar.status,
                "created_at": ar.created_at, "completed_at": ar.completed_at,
            })

        progress = plan_progress.get(plan_id)
        # If we have in-memory agent results and DB is empty, use memory
        if (not ar_list or len(ar_list) == 0) and plan_id in plan_agent_results:
            ar_list = plan_agent_results[plan_id]

        final_report = plan.final_report
        status = plan.status
        current_step = plan.current_step
        pct = plan.progress_percent
        if progress:
            status = progress.get("status", status)
            current_step = progress.get("current_step", current_step)
            pct = progress.get("progress_percent", pct)
            if progress.get("final_report"):
                final_report = progress["final_report"]

        return {
            "id": plan.id, "user_id": plan.user_id, "title": plan.title,
            "status": status, "current_step": current_step, "progress_percent": pct,
            "final_report": final_report, "agent_results": ar_list,
            "created_at": plan.created_at, "completed_at": plan.completed_at,
        }


@router.get("/{plan_id}/progress")
async def get_plan_progress(plan_id: str):
    """Get progress - reads from MEMORY first (no DB access during analysis to avoid locks)."""
    # First check in-memory progress (this is fast and avoids DB locking)
    if plan_id in plan_progress:
        progress = plan_progress[plan_id]
        return {
            "plan_id": plan_id,
            "status": progress.get("status", "processing"),
            "current_step": progress.get("current_step", "starting"),
            "progress_percent": progress.get("progress_percent", 0),
            "agent_results": plan_agent_results.get(plan_id, []),
        }

    # Fallback to DB if no in-memory state
    async with async_session() as db:
        plan = await db.get(Plan, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        result = await db.execute(
            select(AgentResult).where(AgentResult.plan_id == plan_id).order_by(AgentResult.created_at)
        )
        agent_results_db = result.scalars().all()

        ar_list = []
        for ar in agent_results_db:
            try:
                content = json.loads(ar.content) if isinstance(ar.content, str) else ar.content
            except Exception:
                content = {"raw": ar.content}
            ar_list.append({
                "id": ar.id, "agent_type": ar.agent_type, "agent_name": ar.agent_name,
                "content": content, "status": ar.status,
                "created_at": ar.created_at, "completed_at": ar.completed_at,
            })

        status = plan.status
        current_step = plan.current_step
        pct = plan.progress_percent
        if plan.status == "completed":
            status = "completed"
            current_step = "completed"
            pct = 100

        return {
            "plan_id": plan_id,
            "status": status,
            "current_step": current_step,
            "progress_percent": pct,
            "agent_results": ar_list,
        }


@router.post("/{plan_id}/analyze-daily")
async def analyze_daily_log(plan_id: str, daily_log: dict):
    """Analyze daily log."""
    from services.llm import llm_service
    system_prompt = """你是成长教练，返回JSON格式：
{"completion_rate": 80, "analysis": "分析", "highlights": [], "improvements": [], "trend": "上升", "tomorrow_suggestions": [], "encouragement": "加油"}"""
    log_text = f"今日完成: {daily_log.get('completed_tasks', [])}\n学习时长: {daily_log.get('learning_hours', 0)}小时\n代码: {daily_log.get('code_lines', 0)}行"
    return await llm_service.generate_json(system_prompt=system_prompt, user_prompt=log_text)
