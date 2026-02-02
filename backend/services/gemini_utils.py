import time
import random
import logging
import asyncio
from functools import wraps
from google.api_core import exceptions
import google.generativeai as genai

logger = logging.getLogger(__name__)

def retry_gemini_call(max_retries=5, base_delay=1):
    """
    Decorator to retry Gemini API calls with exponential backoff.
    
    Handles 429 Resource Exhausted errors specifically.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except exceptions.ResourceExhausted as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Max retries exceeded for Gemini API call: {e}")
                        raise e

                    # Calculate delay with exponential backoff + jitter
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    delay = min(delay, 60)  # Cap at 60 seconds

                    logger.warning(f"Rate limited (429). Retrying in {delay:.1f}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                except Exception as e:
                    # Re-raise other exceptions immediately
                    raise e
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def retry_gemini_call_sync(max_retries=5, base_delay=1):
    """
    Synchronous version of the retry decorator.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except exceptions.ResourceExhausted as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Max retries exceeded for Gemini API call: {e}")
                        raise e

                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    delay = min(delay, 60)
                    
                    logger.warning(f"Rate limited (429). Retrying in {delay:.1f}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                except Exception as e:
                    raise e
            return func(*args, **kwargs)
        return wrapper
    return decorator
