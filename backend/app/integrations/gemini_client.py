from functools import lru_cache

import google.generativeai as genai

from app.core.config import settings


@lru_cache
def get_gemini_model() -> genai.GenerativeModel | None:
    if not settings.gemini_enabled or not settings.gemini_api_key.strip():
        return None
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(settings.gemini_model)


def reset_gemini_client() -> None:
    get_gemini_model.cache_clear()


def is_gemini_enabled() -> bool:
    return settings.gemini_enabled


def is_gemini_configured() -> bool:
    return bool(settings.gemini_api_key.strip())


def get_gemini_status() -> dict[str, str | bool | float | None]:
    configured = is_gemini_configured()
    enabled = is_gemini_enabled()
    available = bool(get_gemini_model())
    return {
        "enabled": enabled,
        "configured": configured,
        "available": available,
        "provider": "gemini",
        "mode": "gemini" if available else "fallback-local",
        "model": settings.gemini_model if configured else None,
        "timeout_seconds": settings.gemini_timeout_seconds,
    }
