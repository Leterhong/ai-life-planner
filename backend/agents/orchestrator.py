"""Agent Orchestrator - Coordinates multi-agent analysis."""
import asyncio
import json
from datetime import datetime
from typing import Dict, Any, Callable, Awaitable

from sqlalchemy.ext.asyncio import AsyncSession

from .career_agent import CareerAgent
from .learning_agent import LearningAgent
from .finance_agent import FinanceAgent
from .risk_agent import RiskAgent
from .master_agent import MasterAgent
from database.models import Plan, AgentResult, UserProfile, UploadedFile


class AgentOrchestrator:
    """Orchestrates the multi-agent analysis pipeline."""

    def __init__(self):
        self.career_agent = CareerAgent()
        self.learning_agent = LearningAgent()
        self.finance_agent = FinanceAgent()
        self.risk_agent = RiskAgent()
        self.master_agent = MasterAgent()

    async def run_analysis(
        self,
        plan_id: str,
        db: AsyncSession,
        progress_callback: Callable = None,
    ) -> Dict[str, Any]:
        """
        Run the full multi-agent analysis pipeline.
        """
        import inspect

        async def update_progress(step: str, percent: int, message: str):
            if progress_callback:
                try:
                    result = progress_callback(step, percent, message)
                    if inspect.isawaitable(result):
                        await result
                except Exception:
                    pass

        # Get plan with user data
        plan = await db.get(Plan, plan_id)
        if not plan:
            raise ValueError(f"Plan {plan_id} not found")

        # Get user profile
        profile = await db.get(UserProfile, plan.user_id)
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

        # Get uploaded file contents
        from sqlalchemy import select
        result = await db.execute(
            select(UploadedFile).where(
                UploadedFile.user_id == plan.user_id,
                UploadedFile.status == "processed"
            )
        )
        files = result.scalars().all()
        file_contents = "\n\n".join([f.content_text for f in files if f.content_text])

        # Store all agent results
        agent_results = {}

        # ==========================================
        # Step 1: Career Agent
        # ==========================================
        await update_progress("career_analysis", 10, "职业规划专家正在分析...")
        career_result = await self.career_agent.analyze(user_profile_data, file_contents)
        agent_results["career"] = career_result

        # Save to database
        db_agent_result = AgentResult(
            plan_id=plan_id,
            agent_type="career",
            agent_name=career_result["agent_name"],
            content=json.dumps(career_result["content"], ensure_ascii=False),
            status=career_result["status"],
            completed_at=datetime.utcnow() if career_result["status"] == "completed" else None,
        )
        db.add(db_agent_result)
        await db.flush()

        # ==========================================
        # Step 2: Learning Agent
        # ==========================================
        await update_progress("learning_analysis", 25, "学习成长导师正在规划...")
        learning_result = await self.learning_agent.analyze(user_profile_data, file_contents)
        agent_results["learning"] = learning_result

        db_agent_result = AgentResult(
            plan_id=plan_id,
            agent_type="learning",
            agent_name=learning_result["agent_name"],
            content=json.dumps(learning_result["content"], ensure_ascii=False),
            status=learning_result["status"],
            completed_at=datetime.utcnow() if learning_result["status"] == "completed" else None,
        )
        db.add(db_agent_result)
        await db.flush()

        # ==========================================
        # Step 3: Finance Agent
        # ==========================================
        await update_progress("finance_analysis", 40, "财务规划专家正在评估...")
        finance_result = await self.finance_agent.analyze(user_profile_data, file_contents)
        agent_results["finance"] = finance_result

        db_agent_result = AgentResult(
            plan_id=plan_id,
            agent_type="finance",
            agent_name=finance_result["agent_name"],
            content=json.dumps(finance_result["content"], ensure_ascii=False),
            status=finance_result["status"],
            completed_at=datetime.utcnow() if finance_result["status"] == "completed" else None,
        )
        db.add(db_agent_result)
        await db.flush()

        # ==========================================
        # Step 4: Risk Agent (reviews 1-3 results)
        # ==========================================
        await update_progress("risk_analysis", 60, "风险挑战专家正在审查...")
        risk_result = await self.risk_agent.analyze(
            user_profile_data,
            file_contents,
            other_results=agent_results,
        )
        agent_results["risk"] = risk_result

        db_agent_result = AgentResult(
            plan_id=plan_id,
            agent_type="risk",
            agent_name=risk_result["agent_name"],
            content=json.dumps(risk_result["content"], ensure_ascii=False),
            status=risk_result["status"],
            completed_at=datetime.utcnow() if risk_result["status"] == "completed" else None,
        )
        db.add(db_agent_result)
        await db.flush()

        # ==========================================
        # Step 5: Master Agent (synthesizes all)
        # ==========================================
        await update_progress("master_synthesis", 80, "人生总规划师正在生成最终报告...")
        master_result = await self.master_agent.analyze(
            user_profile_data,
            file_contents,
            other_results=agent_results,
        )

        db_agent_result = AgentResult(
            plan_id=plan_id,
            agent_type="master",
            agent_name=master_result["agent_name"],
            content=json.dumps(master_result["content"], ensure_ascii=False),
            status=master_result["status"],
            completed_at=datetime.utcnow() if master_result["status"] == "completed" else None,
        )
        db.add(db_agent_result)
        await db.flush()

        # ==========================================
        # Finalize plan
        # ==========================================
        await update_progress("completed", 100, "规划完成！")

        final_report = master_result.get("content", {})
        # Force correct generated date (always use current date, not AI hallucinated)
        final_report["generated_date"] = datetime.utcnow().strftime("%Y年%m月%d日")
        plan.final_report = final_report
        plan.status = "completed"
        plan.current_step = "completed"
        plan.progress_percent = 100
        plan.completed_at = datetime.utcnow()

        await db.flush()

        return final_report


# Singleton instance
orchestrator = AgentOrchestrator()
