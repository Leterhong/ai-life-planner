"""LLM Service - Seed Evolving API integration.
Supports both /api/v3 and /api/plan endpoints.
"""
import json
import re
import httpx
from typing import List, Dict, Any, Optional, AsyncGenerator

from config import settings


class LLMService:
    """Service for interacting with Seed Evolving (Doubao) API."""

    def __init__(self):
        self.api_key = settings.SEED_API_KEY
        self.base_url = settings.SEED_API_BASE_URL.rstrip("/")
        self.model = settings.SEED_MODEL
        self.timeout = httpx.Timeout(600.0, connect=60.0)  # 10 minutes for long generations
        self.api_format = self._detect_api_format()

    def _detect_api_format(self) -> str:
        """Detect which API format to use based on base URL."""
        if "/plan" in self.base_url:
            return "plan"
        return "v3"

    def _get_headers(self) -> Dict[str, str]:
        """Get appropriate headers for the API format."""
        if self.api_format == "plan":
            # Anthropic-compatible format uses x-api-key
            return {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            }
        else:
            return {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 8192,
        response_format: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Call the Seed Evolving chat completion API.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            response_format: Optional format specification

        Returns:
            The generated text content
        """
        if self.api_format == "plan":
            return await self._call_plan_api(messages, temperature, max_tokens)
        else:
            return await self._call_v3_api(messages, temperature, max_tokens, response_format)

    async def _call_v3_api(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        response_format: Optional[Dict[str, str]],
    ) -> str:
        """Call using OpenAI-compatible /api/v3 endpoint."""
        url = f"{self.base_url}/chat/completions"

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        if response_format:
            payload["response_format"] = response_format

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                error_detail = e.response.text if e.response else str(e)
                raise Exception(f"Seed API error: {error_detail}")
            except Exception as e:
                raise Exception(f"LLM call failed: {str(e)}")

    async def _call_plan_api(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Call using Anthropic-compatible /api/plan endpoint."""
        url = f"{self.base_url}/v1/messages"

        # Convert messages to Anthropic format
        system_content = ""
        anthropic_messages = []

        for msg in messages:
            if msg["role"] == "system":
                system_content += msg["content"] + "\n"
            elif msg["role"] == "user":
                anthropic_messages.append({
                    "role": "user",
                    "content": msg["content"]
                })
            elif msg["role"] == "assistant":
                anthropic_messages.append({
                    "role": "assistant",
                    "content": msg["content"]
                })

        payload = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": anthropic_messages,
        }

        if system_content:
            payload["system"] = system_content.strip()

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

                # Extract text content from Anthropic/Seed response
                # Skip "thinking" blocks, only collect "text" blocks
                content = data.get("content", [])
                if isinstance(content, list):
                    text_parts = []
                    for block in content:
                        if isinstance(block, dict):
                            if block.get("type") == "text":
                                text_parts.append(block.get("text", ""))
                            # thinking blocks are skipped (internal reasoning)
                    return "".join(text_parts)
                elif isinstance(content, str):
                    return content
                return str(content)
            except httpx.HTTPStatusError as e:
                error_detail = e.response.text if e.response else str(e)
                raise Exception(f"Seed Plan API error: {error_detail}")
            except Exception as e:
                raise Exception(f"LLM Plan call failed: {str(e)}")

    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion responses."""
        # Streaming is mainly supported on v3 endpoint
        url = f"{self.base_url}/chat/completions"

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "POST",
                url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if data.get("choices"):
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Generate a JSON response from the LLM.

        Args:
            system_prompt: System instruction
            user_prompt: User content
            temperature: Sampling temperature

        Returns:
            Parsed JSON dictionary
        """
        json_system_prompt = system_prompt + "\n请严格以JSON格式返回结果，不要包含任何其他文字、markdown格式或解释。"
        messages = [
            {"role": "system", "content": json_system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        response = await self.chat_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=16384,
        )

        # Try to extract JSON from response
        try:
            # First try direct parse
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to find JSON block in markdown
            if "```json" in response:
                match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
            elif "```" in response:
                match = re.search(r"```\s*(.*?)\s*```", response, re.DOTALL)
                if match:
                    try:
                        return json.loads(match.group(1))
                    except json.JSONDecodeError:
                        pass

            # Try to find JSON object by braces
            brace_start = response.find("{")
            brace_end = response.rfind("}")
            if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
                try:
                    return json.loads(response[brace_start:brace_end + 1])
                except json.JSONDecodeError:
                    pass

            # Return as raw text wrapped in a dict
            return {"raw_content": response}


# Singleton instance
llm_service = LLMService()
