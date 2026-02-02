"""
Conversation Memory Service for ElectroLab
Manages user context, conversation history, and adaptive learning.
"""

import os
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from collections import Counter
from db import db
from bson import ObjectId


@dataclass
class UserProfile:
    """Long-term user profile stored in database."""
    user_id: str
    skill_level: str = "beginner"  # beginner, intermediate, advanced
    total_sessions: int = 0
    topics_explored: Dict[str, int] = field(default_factory=dict)  # topic -> count
    common_mistakes: List[str] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)
    preferred_boards: List[str] = field(default_factory=list)
    completed_projects: List[str] = field(default_factory=list)
    last_active: Optional[datetime] = None
    created_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d['last_active'] = self.last_active.isoformat() if self.last_active else None
        d['created_at'] = self.created_at.isoformat() if self.created_at else None
        return d


@dataclass
class SessionContext:
    """Short-term session context (current conversation)."""
    session_id: str
    user_id: str
    project_name: Optional[str] = None
    project_type: Optional[str] = None  # IoT, Robotics, Audio, Power
    current_board: Optional[str] = None
    components_discussed: List[str] = field(default_factory=list)
    problems_identified: List[str] = field(default_factory=list)
    solutions_provided: List[str] = field(default_factory=list)
    topics_covered: List[str] = field(default_factory=list)
    pending_questions: List[str] = field(default_factory=list)
    message_count: int = 0


@dataclass
class ConversationSummary:
    """Compressed summary of a conversation for context injection."""
    session_id: str
    summary_text: str
    key_decisions: List[str]
    unresolved_issues: List[str]
    components: List[str]
    created_at: datetime


class MemoryService:
    """
    Manages conversation memory and user context.

    Memory Architecture:
    1. Long-term (Database): User profile, skill assessment, completed projects
    2. Medium-term (Session): Current project context, components, problems
    3. Short-term (Window): Recent messages for immediate context
    """

    def __init__(self):
        self.profiles_collection = "user_profiles"
        self.summaries_collection = "conversation_summaries"

        # In-memory cache for active sessions
        self._session_cache: Dict[str, SessionContext] = {}

        # Context window limits (for Gemini token management)
        self.max_history_messages = 20
        self.max_history_chars = 8000
        self.summary_threshold = 15  # Summarize after this many messages

    # =========================================================================
    # USER PROFILE MANAGEMENT (Long-term Memory)
    # =========================================================================

    async def get_user_profile(self, user_id: str) -> UserProfile:
        """Get or create user profile."""
        try:
            doc = await db.db[self.profiles_collection].find_one({"user_id": user_id})
            if doc:
                return UserProfile(
                    user_id=doc["user_id"],
                    skill_level=doc.get("skill_level", "beginner"),
                    total_sessions=doc.get("total_sessions", 0),
                    topics_explored=doc.get("topics_explored", {}),
                    common_mistakes=doc.get("common_mistakes", []),
                    strengths=doc.get("strengths", []),
                    preferred_boards=doc.get("preferred_boards", []),
                    completed_projects=doc.get("completed_projects", []),
                    last_active=doc.get("last_active"),
                    created_at=doc.get("created_at")
                )
            else:
                # Create new profile
                profile = UserProfile(
                    user_id=user_id,
                    created_at=datetime.utcnow(),
                    last_active=datetime.utcnow()
                )
                await self._save_profile(profile)
                return profile
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return UserProfile(user_id=user_id)

    async def _save_profile(self, profile: UserProfile):
        """Save user profile to database."""
        try:
            await db.db[self.profiles_collection].update_one(
                {"user_id": profile.user_id},
                {"$set": profile.to_dict()},
                upsert=True
            )
        except Exception as e:
            print(f"Error saving user profile: {e}")

    async def update_skill_level(self, user_id: str, indicators: Dict[str, Any]):
        """
        Update user skill level based on conversation indicators.

        Indicators might include:
        - complexity_of_questions: 1-10
        - uses_technical_terms: bool
        - asks_about_optimization: bool
        - understands_explanations: bool
        """
        profile = await self.get_user_profile(user_id)

        # Simple skill level detection logic
        complexity = indicators.get("complexity_of_questions", 5)
        technical = indicators.get("uses_technical_terms", False)
        optimization = indicators.get("asks_about_optimization", False)

        if complexity >= 8 and technical and optimization:
            new_level = "advanced"
        elif complexity >= 5 or technical:
            new_level = "intermediate"
        else:
            new_level = "beginner"

        # Only upgrade, don't downgrade based on single conversation
        level_order = {"beginner": 0, "intermediate": 1, "advanced": 2}
        if level_order.get(new_level, 0) > level_order.get(profile.skill_level, 0):
            profile.skill_level = new_level
            await self._save_profile(profile)

        return profile.skill_level

    async def record_topic(self, user_id: str, topic: str):
        """Record that user explored a topic."""
        try:
            await db.db[self.profiles_collection].update_one(
                {"user_id": user_id},
                {
                    "$inc": {f"topics_explored.{topic}": 1},
                    "$set": {"last_active": datetime.utcnow()}
                },
                upsert=True
            )
        except Exception as e:
            print(f"Error recording topic: {e}")

    async def record_mistake(self, user_id: str, mistake: str):
        """Record a common mistake the user made (for future warnings)."""
        try:
            await db.db[self.profiles_collection].update_one(
                {"user_id": user_id},
                {
                    "$addToSet": {"common_mistakes": mistake},
                    "$set": {"last_active": datetime.utcnow()}
                },
                upsert=True
            )
        except Exception as e:
            print(f"Error recording mistake: {e}")

    # =========================================================================
    # SESSION CONTEXT MANAGEMENT (Medium-term Memory)
    # =========================================================================

    def get_session_context(self, session_id: str, user_id: str) -> SessionContext:
        """Get or create session context."""
        if session_id not in self._session_cache:
            self._session_cache[session_id] = SessionContext(
                session_id=session_id,
                user_id=user_id
            )
        return self._session_cache[session_id]

    def update_session_context(
        self,
        session_id: str,
        components: Optional[List[str]] = None,
        problems: Optional[List[str]] = None,
        solutions: Optional[List[str]] = None,
        topics: Optional[List[str]] = None,
        project_name: Optional[str] = None,
        project_type: Optional[str] = None,
        board: Optional[str] = None
    ):
        """Update session context with new information."""
        if session_id not in self._session_cache:
            return

        ctx = self._session_cache[session_id]

        if components:
            ctx.components_discussed.extend(components)
            ctx.components_discussed = list(set(ctx.components_discussed))

        if problems:
            ctx.problems_identified.extend(problems)

        if solutions:
            ctx.solutions_provided.extend(solutions)

        if topics:
            ctx.topics_covered.extend(topics)
            ctx.topics_covered = list(set(ctx.topics_covered))

        if project_name:
            ctx.project_name = project_name
        if project_type:
            ctx.project_type = project_type
        if board:
            ctx.current_board = board

        ctx.message_count += 1

    def clear_session(self, session_id: str):
        """Clear session from cache."""
        if session_id in self._session_cache:
            del self._session_cache[session_id]

    # =========================================================================
    # CONVERSATION HISTORY MANAGEMENT (Short-term Memory)
    # =========================================================================

    async def get_conversation_history(
        self,
        session_id: str,
        max_messages: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """Get conversation history from database."""
        try:
            session = await db.db["chat_sessions"].find_one(
                {"_id": ObjectId(session_id)}
            )
            if not session:
                return []

            messages = session.get("messages", [])
            limit = max_messages or self.max_history_messages

            # Return recent messages
            return [
                {"role": m["role"], "content": m["content"]}
                for m in messages[-limit:]
            ]
        except Exception as e:
            print(f"Error getting conversation history: {e}")
            return []

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Add a message to the conversation history."""
        try:
            import uuid
            message = {
                "id": str(uuid.uuid4()),
                "role": role,
                "content": content,
                "timestamp": datetime.utcnow(),
                "metadata": metadata or {}
            }

            # Update dict for the session
            update_ops = {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()}
            }

            # Valid ObjectId check
            try:
                oid = ObjectId(session_id)
            except:
                # If session_id is not a valid ObjectId (e.g. "new"), we might fail
                # But typically the frontend should have created a session first.
                return message

            # Auto-update title if it's "New Chat" and this is a user message
            if role == "user":
                session = await db.db["chat_sessions"].find_one({"_id": oid}, {"title": 1})
                if session and session.get("title") == "New Chat":
                    title = content[:50] + ("..." if len(content) > 50 else "")
                    update_ops["$set"]["title"] = title

            await db.db["chat_sessions"].update_one(
                {"_id": oid},
                update_ops
            )
            return message
        except Exception as e:
            print(f"Error adding message to history: {e}")
            return {}


    def prepare_context_for_ai(
        self,
        history: List[Dict[str, str]],
        session_context: SessionContext,
        user_profile: UserProfile
    ) -> Dict[str, Any]:
        """
        Prepare optimized context for AI request.

        Strategy:
        1. Include full recent messages (last 5)
        2. Summarize older messages
        3. Add session context (current project, components)
        4. Add relevant user profile info
        """
        # Recent messages (full context)
        recent_messages = history[-5:] if len(history) > 5 else history

        # Older messages (summarized)
        older_messages = history[:-5] if len(history) > 5 else []
        older_summary = self._summarize_messages(older_messages) if older_messages else None

        # Build context
        context = {
            "user_profile": {
                "skill_level": user_profile.skill_level,
                "common_mistakes": user_profile.common_mistakes[-3:],  # Last 3
                "preferred_boards": user_profile.preferred_boards,
                "recent_topics": list(user_profile.topics_explored.keys())[-5:]
            },
            "session": {
                "project_name": session_context.project_name,
                "project_type": session_context.project_type,
                "current_board": session_context.current_board,
                "components_discussed": session_context.components_discussed[-10:],
                "problems_identified": session_context.problems_identified[-5:],
                "topics_covered": session_context.topics_covered[-5:]
            },
            "conversation": {
                "older_summary": older_summary,
                "recent_messages": recent_messages
            }
        }

        return context

    def _summarize_messages(self, messages: List[Dict[str, str]]) -> str:
        """Create a brief summary of messages."""
        if not messages:
            return ""

        # Extract key information
        user_questions = []
        ai_answers = []

        for msg in messages:
            content = msg.get("content", "")[:200]  # Truncate long messages
            if msg.get("role") == "user":
                user_questions.append(content)
            else:
                # Extract first sentence of AI response
                first_sentence = content.split(".")[0] if "." in content else content[:100]
                ai_answers.append(first_sentence)

        summary_parts = []
        if user_questions:
            summary_parts.append(f"User asked about: {'; '.join(user_questions[-3:])}")
        if ai_answers:
            summary_parts.append(f"Discussed: {'; '.join(ai_answers[-3:])}")

        return " | ".join(summary_parts)

    # =========================================================================
    # CONVERSATION SUMMARIZATION (For Long Conversations)
    # =========================================================================

    async def create_conversation_summary(
        self,
        session_id: str,
        messages: List[Dict[str, str]]
    ) -> ConversationSummary:
        """
        Create and store a summary of a conversation.
        Called when conversation exceeds threshold or session ends.
        """
        # Extract key information from messages
        components = self._extract_components(messages)
        decisions = self._extract_decisions(messages)
        issues = self._extract_unresolved_issues(messages)

        # Create summary text
        summary_text = self._generate_summary_text(messages)

        summary = ConversationSummary(
            session_id=session_id,
            summary_text=summary_text,
            key_decisions=decisions,
            unresolved_issues=issues,
            components=components,
            created_at=datetime.utcnow()
        )

        # Store in database
        try:
            await db.db[self.summaries_collection].insert_one({
                "session_id": session_id,
                "summary_text": summary_text,
                "key_decisions": decisions,
                "unresolved_issues": issues,
                "components": components,
                "created_at": summary.created_at
            })
        except Exception as e:
            print(f"Error storing conversation summary: {e}")

        return summary

    def _extract_components(self, messages: List[Dict[str, str]]) -> List[str]:
        """Extract component mentions from messages."""
        component_keywords = [
            "resistor", "capacitor", "inductor", "led", "diode",
            "transistor", "mosfet", "op-amp", "opamp", "ic",
            "esp32", "esp8266", "arduino", "raspberry", "pico",
            "sensor", "motor", "relay", "display", "oled", "lcd",
            "regulator", "buck", "boost", "ldo"
        ]

        found = []
        for msg in messages:
            content = msg.get("content", "").lower()
            for keyword in component_keywords:
                if keyword in content and keyword not in found:
                    found.append(keyword)

        return found

    def _extract_decisions(self, messages: List[Dict[str, str]]) -> List[str]:
        """Extract decisions made during conversation."""
        decision_indicators = [
            "let's use", "we'll use", "i recommend", "you should use",
            "the best choice", "i suggest", "go with"
        ]

        decisions = []
        for msg in messages:
            if msg.get("role") != "assistant":
                continue

            content = msg.get("content", "").lower()
            for indicator in decision_indicators:
                if indicator in content:
                    # Extract sentence containing the indicator
                    sentences = content.split(".")
                    for sentence in sentences:
                        if indicator in sentence and len(sentence) < 200:
                            decisions.append(sentence.strip())
                            break

        return decisions[:5]  # Limit to 5 key decisions

    def _extract_unresolved_issues(self, messages: List[Dict[str, str]]) -> List[str]:
        """Extract questions or issues that weren't fully resolved."""
        # Look for questions in user's last few messages
        issues = []
        recent_user_msgs = [m for m in messages[-6:] if m.get("role") == "user"]

        for msg in recent_user_msgs:
            content = msg.get("content", "")
            if "?" in content:
                # Extract the question
                sentences = content.split("?")
                for sentence in sentences[:-1]:  # Exclude empty after last ?
                    if len(sentence) > 10:
                        issues.append(sentence.strip() + "?")

        return issues[:3]

    def _generate_summary_text(self, messages: List[Dict[str, str]]) -> str:
        """Generate a brief text summary of the conversation."""
        if not messages:
            return "No conversation content."

        # Get first user message (usually describes the goal)
        first_user = next(
            (m["content"][:150] for m in messages if m.get("role") == "user"),
            "User inquiry"
        )

        # Count exchanges
        user_count = sum(1 for m in messages if m.get("role") == "user")
        ai_count = sum(1 for m in messages if m.get("role") == "assistant")

        return f"Started with: '{first_user}...' | {user_count} questions, {ai_count} responses"

    # =========================================================================
    # ADAPTIVE RESPONSE HINTS
    # =========================================================================

    def get_response_hints(
        self,
        user_profile: UserProfile,
        session_context: SessionContext
    ) -> Dict[str, Any]:
        """
        Generate hints for how the AI should respond based on user context.

        Returns guidance on:
        - Explanation depth
        - Technical terminology level
        - Whether to include warnings about past mistakes
        - Suggested follow-up topics
        """
        hints = {
            "explanation_level": "basic",
            "use_analogies": True,
            "include_math": False,
            "warn_about_mistakes": [],
            "suggest_topics": [],
            "tone": "encouraging"
        }

        # Adjust based on skill level
        if user_profile.skill_level == "beginner":
            hints["explanation_level"] = "basic"
            hints["use_analogies"] = True
            hints["include_math"] = False
            hints["tone"] = "encouraging and patient"
        elif user_profile.skill_level == "intermediate":
            hints["explanation_level"] = "moderate"
            hints["use_analogies"] = True
            hints["include_math"] = True
            hints["tone"] = "collaborative"
        else:  # advanced
            hints["explanation_level"] = "detailed"
            hints["use_analogies"] = False
            hints["include_math"] = True
            hints["tone"] = "peer discussion"

        # Add warnings about past mistakes
        if user_profile.common_mistakes:
            # Check if current context might trigger past mistakes
            current_topics = set(session_context.topics_covered)
            for mistake in user_profile.common_mistakes[-3:]:
                mistake_lower = mistake.lower()
                if any(topic.lower() in mistake_lower for topic in current_topics):
                    hints["warn_about_mistakes"].append(mistake)

        # Suggest related topics based on exploration history
        top_topics = sorted(
            user_profile.topics_explored.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        related_suggestions = {
            "amplifier": ["feedback", "stability", "frequency response"],
            "filter": ["cutoff frequency", "filter order", "active filters"],
            "power": ["efficiency", "thermal design", "regulation"],
            "sensor": ["signal conditioning", "ADC", "calibration"],
            "motor": ["PWM", "H-bridge", "current sensing"]
        }
        for topic, _ in top_topics:
            if topic in related_suggestions:
                hints["suggest_topics"].extend(related_suggestions[topic])

        return hints


# Singleton instance
_memory_service: Optional[MemoryService] = None


def get_memory_service() -> MemoryService:
    """Get or create the memory service singleton."""
    global _memory_service
    if _memory_service is None:
        _memory_service = MemoryService()
    return _memory_service
