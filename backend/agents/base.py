"""Base agent class."""
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from services.llm import llm_service


class BaseAgent(ABC):
    """Base class for all agents."""

    def __init__(self, agent_type: str, agent_name: str):
        self.agent_type = agent_type
        self.agent_name = agent_name
        self.llm = llm_service

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the system prompt for this agent."""
        pass

    def format_user_context(self, user_profile: Dict[str, Any], file_contents: str) -> str:
        """Format user information into a context string."""
        profile = user_profile or {}

        context_parts = ["## 用户基本信息\n"]

        # Basic info
        basic_fields = [
            ("年龄", profile.get("age")),
            ("学历", profile.get("education")),
            ("专业", profile.get("major")),
            ("当前职业", profile.get("current_job")),
            ("所在行业", profile.get("industry")),
            ("工作经验(年)", profile.get("work_experience_years")),
        ]
        for label, value in basic_fields:
            if value:
                context_parts.append(f"- {label}: {value}")

        # Skills
        skills_section = []
        if profile.get("programming_skills"):
            skills_section.append(f"- 编程能力: {', '.join(profile['programming_skills'])}")
        if profile.get("language_skills"):
            skills_section.append(f"- 语言能力: {', '.join(profile['language_skills'])}")
        if profile.get("professional_skills"):
            skills_section.append(f"- 专业技能: {', '.join(profile['professional_skills'])}")
        if skills_section:
            context_parts.append("\n## 技能信息\n")
            context_parts.extend(skills_section)

        # Interests
        if profile.get("interests"):
            context_parts.append(f"\n## 兴趣方向\n- {', '.join(profile['interests'])}")

        # Goals
        goals_section = []
        if profile.get("career_goal"):
            goals_section.append(f"- 职业目标: {profile['career_goal']}")
        if profile.get("income_goal"):
            goals_section.append(f"- 收入目标: {profile['income_goal']}")
        if profile.get("learning_goal"):
            goals_section.append(f"- 学习目标: {profile['learning_goal']}")
        if profile.get("life_goal"):
            goals_section.append(f"- 人生目标: {profile['life_goal']}")
        if goals_section:
            context_parts.append("\n## 未来目标\n")
            context_parts.extend(goals_section)

        # Additional info
        if profile.get("additional_info"):
            context_parts.append(f"\n## 其他信息\n{profile['additional_info']}")

        # File contents
        if file_contents and file_contents.strip():
            context_parts.append("\n## 用户上传资料\n")
            context_parts.append(file_contents[:50000])  # Limit context size

        return "\n".join(context_parts)

    async def analyze(self, user_profile: Dict[str, Any], file_contents: str, other_results: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run the agent analysis.

        Args:
            user_profile: User profile dictionary
            file_contents: Extracted text from uploaded files
            other_results: Results from other agents (for master/risk agents)

        Returns:
            Analysis result dictionary
        """
        system_prompt = self.get_system_prompt()
        user_prompt = self.format_user_context(user_profile, file_contents)

        if other_results:
            user_prompt += "\n\n## 其他专家分析结果\n"
            for agent_type, result in other_results.items():
                if agent_type != self.agent_type and result:
                    user_prompt += f"\n### {result.get('agent_name', agent_type)}的分析\n"
                    user_prompt += json.dumps(result.get("content", result), ensure_ascii=False, indent=2)
                    user_prompt += "\n"

        # Retry up to 2 times for transient errors
        last_error = None
        for attempt in range(3):
            try:
                result = await self.llm.generate_json(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=0.7,
                )
                return {
                    "agent_type": self.agent_type,
                    "agent_name": self.agent_name,
                    "content": result,
                    "status": "completed",
                }
            except Exception as e:
                last_error = e
                error_str = str(e)
                # Don't retry on auth errors
                if "AuthenticationError" in error_str or "Unauthorized" in error_str or "Invalid" in error_str:
                    break
                import asyncio
                if attempt < 2:
                    await asyncio.sleep(2)  # Wait 2 seconds before retry
        return {
            "agent_type": self.agent_type,
            "agent_name": self.agent_name,
            "content": {"error": str(last_error), "raw_response": f"分析过程中出现问题(重试{3}次后失败): {str(last_error)[:200]}"},
            "status": "failed",
            "error": str(last_error),
        }
