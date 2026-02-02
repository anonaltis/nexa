# Changelog - February 2, 2026

## 🐛 Bug Fixes & Improvements

### 1. Chat Persistence (Fixed "0 Messages" Error)
- **Problem**: Chat messages were not being saved to the database in the new V3 chat engine, causing history to vanish on reload.
- **Fix**: 
    - Updated `backend/services/memory_service.py` to include an `add_message()` method.
    - Updated `backend/api/chat_v3.py` to correctly persist both User and Assistant messages to MongoDB.
    - Restored logic to auto-rename "New Chat" sessions based on the first message.

### 2. Server Stability (Fixed Crashing)
- **Problem**: Server failed to start due to missing files and import errors.
- **Fix**:
    - Created missing `backend/services/gemini_utils.py` containing the `retry_gemini_call` logic for handling 429 Rate Limits.
    - Added `backend/services/__init__.py` to ensure the `services` folder is treated as a valid Python package.

### 3. API Robustness
- **Problem**: `ValueError` when Gemini API returned empty content (rare edge case).
- **Fix**:
    - Added safety checks in `backend/services/gemini_function_calling.py` to handle empty responses gracefully without crashing.

## 📂 Files Modified
- `backend/api/chat_v3.py`
- `backend/services/memory_service.py`
- `backend/services/gemini_function_calling.py`
- `backend/services/gemini_utils.py` (New)
- `backend/services/__init__.py` (New)
