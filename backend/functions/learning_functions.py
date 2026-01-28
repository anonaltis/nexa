"""
Learning and Adaptive Functions for Gemini Function Calling

These functions manage the adaptive learning system:
- Track user progress and mistakes
- Generate personalized learning content
- Adjust difficulty dynamically
"""

from typing import Any
from datetime import datetime
from enum import Enum


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class LearningFunctions:
    """
    Learning management functions.

    These track user progress and generate adaptive content.
    """

    # In-memory store (replace with database in production)
    _learning_events: dict[str, list[dict]] = {}
    _user_profiles: dict[str, dict] = {}

    @classmethod
    async def get_user_learning_profile(
        cls,
        user_id: str,
        include_history: bool = False
    ) -> dict[str, Any]:
        """
        Retrieve user's learning profile for personalization.

        Returns skill level, strengths, weaknesses, and optionally history.
        """
        profile = cls._user_profiles.get(user_id, cls._create_default_profile(user_id))

        result = {
            "user_id": user_id,
            "skill_level": profile["skill_level"],
            "topics_explored": profile.get("topics_explored", {}),
            "common_mistakes": profile.get("common_mistakes", []),
            "strengths": profile.get("strengths", []),
            "total_sessions": profile.get("total_sessions", 0),
            "last_active": profile.get("last_active"),
            "recommended_difficulty": cls._calculate_recommended_difficulty(profile)
        }

        if include_history:
            events = cls._learning_events.get(user_id, [])
            result["recent_events"] = events[-10:]  # Last 10 events

        return result

    @classmethod
    def _create_default_profile(cls, user_id: str) -> dict:
        """Create default profile for new user."""
        return {
            "user_id": user_id,
            "skill_level": SkillLevel.BEGINNER,
            "topics_explored": {},
            "common_mistakes": [],
            "strengths": [],
            "total_sessions": 0,
            "created_at": datetime.now().isoformat(),
            "last_active": datetime.now().isoformat()
        }

    @classmethod
    def _calculate_recommended_difficulty(cls, profile: dict) -> str:
        """Calculate recommended difficulty based on profile."""
        skill = profile.get("skill_level", SkillLevel.BEGINNER)
        mistakes_count = len(profile.get("common_mistakes", []))
        topics_count = len(profile.get("topics_explored", {}))

        if skill == SkillLevel.ADVANCED:
            return "hard"
        elif skill == SkillLevel.INTERMEDIATE:
            if mistakes_count > 5:
                return "medium"  # More practice needed
            return "medium-hard"
        else:
            if topics_count > 10 and mistakes_count < 3:
                return "medium"  # Ready to advance
            return "easy"

    @classmethod
    async def record_learning_event(
        cls,
        user_id: str,
        event_type: str,
        topic: str,
        difficulty: str = "medium",
        details: str | None = None
    ) -> dict[str, Any]:
        """
        Record a learning event for adaptive tracking.

        Event types: correct_answer, mistake, concept_understood,
                    asked_for_help, completed_project
        """
        event = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "topic": topic,
            "difficulty": difficulty,
            "details": details
        }

        # Store event
        if user_id not in cls._learning_events:
            cls._learning_events[user_id] = []
        cls._learning_events[user_id].append(event)

        # Update profile based on event
        profile = cls._user_profiles.get(user_id, cls._create_default_profile(user_id))

        # Update topics explored
        if topic not in profile["topics_explored"]:
            profile["topics_explored"][topic] = {"count": 0, "successes": 0, "mistakes": 0}
        profile["topics_explored"][topic]["count"] += 1

        # Update based on event type
        if event_type == "correct_answer":
            profile["topics_explored"][topic]["successes"] += 1
            cls._check_skill_upgrade(profile, topic, difficulty)
        elif event_type == "mistake":
            profile["topics_explored"][topic]["mistakes"] += 1
            if details and details not in profile["common_mistakes"]:
                profile["common_mistakes"].append(details)
                # Keep only recent mistakes
                profile["common_mistakes"] = profile["common_mistakes"][-10:]
        elif event_type == "concept_understood":
            if topic not in profile["strengths"]:
                profile["strengths"].append(topic)

        profile["last_active"] = datetime.now().isoformat()
        cls._user_profiles[user_id] = profile

        return {
            "recorded": True,
            "event": event,
            "profile_updated": True,
            "current_skill_level": profile["skill_level"]
        }

    @classmethod
    def _check_skill_upgrade(cls, profile: dict, topic: str, difficulty: str):
        """Check if user should be upgraded to higher skill level."""
        current_skill = profile["skill_level"]
        topics = profile["topics_explored"]

        # Count successful hard topics
        hard_successes = sum(
            1 for t, data in topics.items()
            if data["successes"] > data["mistakes"] and data["count"] > 3
        )

        if current_skill == SkillLevel.BEGINNER:
            if hard_successes >= 5 and difficulty in ["medium", "hard"]:
                profile["skill_level"] = SkillLevel.INTERMEDIATE
        elif current_skill == SkillLevel.INTERMEDIATE:
            if hard_successes >= 10 and difficulty == "hard":
                profile["skill_level"] = SkillLevel.ADVANCED

    @classmethod
    async def generate_learning_summary(
        cls,
        topic: str,
        skill_level: str,
        format: str,
        focus_areas: list[str] | None = None
    ) -> dict[str, Any]:
        """
        Generate personalized learning content.

        Formats: viva_questions, concept_summary, practice_problems, quick_review
        """
        result = {
            "topic": topic,
            "skill_level": skill_level,
            "format": format,
            "content": {}
        }

        if format == "viva_questions":
            result["content"] = cls._generate_viva_questions(topic, skill_level, focus_areas)
        elif format == "concept_summary":
            result["content"] = cls._generate_concept_summary(topic, skill_level)
        elif format == "practice_problems":
            result["content"] = cls._generate_practice_problems(topic, skill_level)
        elif format == "quick_review":
            result["content"] = cls._generate_quick_review(topic, skill_level)

        return result

    @classmethod
    def _generate_viva_questions(
        cls,
        topic: str,
        skill_level: str,
        focus_areas: list[str] | None = None
    ) -> dict:
        """Generate viva questions for a topic."""
        topic_lower = topic.lower()

        # Question database by topic and level
        questions_db = {
            "led": {
                "beginner": [
                    {"q": "What is the purpose of a current limiting resistor with an LED?", "a": "To limit current flow and prevent the LED from burning out. LEDs have very low internal resistance."},
                    {"q": "How do you identify the positive and negative terminals of an LED?", "a": "Longer leg is anode (+), shorter leg is cathode (-). Flat side of the case is cathode."},
                    {"q": "What happens if you connect an LED directly to 5V without a resistor?", "a": "The LED will draw excessive current and burn out almost instantly."}
                ],
                "intermediate": [
                    {"q": "How do you calculate the resistor value for an LED circuit?", "a": "R = (Vs - Vf) / If, where Vs is supply voltage, Vf is LED forward voltage, If is desired current."},
                    {"q": "Why do different colored LEDs have different forward voltages?", "a": "The forward voltage depends on the bandgap of the semiconductor material. Blue/white LEDs use materials with higher bandgaps (~3.2V) than red LEDs (~1.8V)."},
                    {"q": "What is the typical forward current range for standard LEDs?", "a": "10-20mA for normal brightness. Maximum is usually 20-30mA."}
                ],
                "advanced": [
                    {"q": "Explain the V-I characteristics of an LED and why it's considered a non-linear device.", "a": "LEDs have exponential V-I characteristics. Below Vf, almost no current flows. At Vf, current rises exponentially with small voltage increases. This is why current limiting is essential."},
                    {"q": "How would you drive multiple LEDs efficiently from a single supply?", "a": "Series connection shares current but requires higher voltage. Parallel requires individual resistors. For many LEDs, use constant current LED driver ICs for efficiency."},
                    {"q": "What factors affect LED efficiency and how can you maximize it?", "a": "Junction temperature, forward current (sweet spot around 10-15mA), thermal management. Pulsed operation can achieve higher peak brightness with lower average power."}
                ]
            },
            "voltage_divider": {
                "beginner": [
                    {"q": "What is a voltage divider and what is it used for?", "a": "A voltage divider is two resistors in series that produce a lower voltage output. Used to reduce voltage levels for sensing or reference."},
                    {"q": "Write the voltage divider formula.", "a": "Vout = Vin × (R2 / (R1 + R2)), where R2 is the resistor connected to ground."}
                ],
                "intermediate": [
                    {"q": "Why shouldn't you use a voltage divider to power a load?", "a": "The output voltage drops when loaded because the divider has high output impedance. It's only suitable for high-impedance inputs like MCU ADC pins."},
                    {"q": "How do you choose resistor values for a voltage divider?", "a": "Balance between current consumption and output impedance. Higher values = less current but more noise susceptible. 10kΩ-100kΩ range is common."}
                ],
                "advanced": [
                    {"q": "Explain the Thevenin equivalent of a voltage divider and its implications.", "a": "Vth = Vin × R2/(R1+R2), Rth = R1||R2. The Thevenin resistance determines load regulation and noise performance."},
                    {"q": "How would you design a voltage divider for a capacitive load?", "a": "Add series resistance to limit charging current, consider settling time τ = Rth × Cload. May need buffer amplifier for fast response."}
                ]
            },
            "ohms_law": {
                "beginner": [
                    {"q": "State Ohm's Law and explain each term.", "a": "V = I × R. Voltage (V) in Volts equals Current (I) in Amperes times Resistance (R) in Ohms."},
                    {"q": "If you have 12V and 4Ω, what is the current?", "a": "I = V/R = 12V / 4Ω = 3A"}
                ],
                "intermediate": [
                    {"q": "Does Ohm's Law apply to all components?", "a": "No, only to 'ohmic' devices with linear V-I relationship. Diodes, LEDs, transistors are non-linear and don't follow Ohm's Law directly."},
                    {"q": "How do you combine Ohm's Law with Kirchhoff's Laws?", "a": "Use KVL to write voltage equations around loops, KCL for current at nodes, then apply Ohm's Law for voltage drops across resistors."}
                ],
                "advanced": [
                    {"q": "Explain the microscopic basis of Ohm's Law.", "a": "Drift velocity of electrons is proportional to electric field. Resistance arises from electron scattering. Temperature increases resistance in metals due to increased lattice vibrations."},
                    {"q": "When does Ohm's Law break down?", "a": "At very high fields (avalanche breakdown), very low temperatures (superconductivity), very small scales (quantum tunneling), or in semiconductors (non-linear)."}
                ]
            },
            "power_supply": {
                "beginner": [
                    {"q": "What is the difference between AC and DC power?", "a": "AC alternates direction periodically (50/60Hz). DC flows in one direction only. Most electronics need DC."},
                    {"q": "What does a voltage regulator do?", "a": "Maintains constant output voltage regardless of input voltage variations or load changes."}
                ],
                "intermediate": [
                    {"q": "Calculate power dissipation in a linear regulator.", "a": "P = (Vin - Vout) × Iout. Example: 12V input, 5V/1A output = (12-5)×1 = 7W heat dissipation."},
                    {"q": "Why are decoupling capacitors important?", "a": "They provide local energy storage, filter high-frequency noise, and compensate for supply inductance. Typically 0.1µF ceramic near each IC."}
                ],
                "advanced": [
                    {"q": "Compare linear vs switching regulators.", "a": "Linear: Simple, low noise, poor efficiency (especially large Vin-Vout). Switching: High efficiency (>90%), but generates EMI, more complex, requires external components."},
                    {"q": "Explain the stability requirements for a linear regulator.", "a": "Requires specific ESR range for output capacitor. Too low ESR can cause oscillation. Internal compensation sets bandwidth and phase margin."}
                ]
            },
            "rc_filter": {
                "beginner": [
                    {"q": "What is an RC filter?", "a": "A combination of resistor and capacitor that passes some frequencies and blocks others."},
                    {"q": "What is the difference between low-pass and high-pass filters?", "a": "Low-pass passes low frequencies, blocks high. High-pass does opposite. Determined by component arrangement."}
                ],
                "intermediate": [
                    {"q": "Write the formula for cutoff frequency of an RC filter.", "a": "fc = 1/(2πRC). At this frequency, output is -3dB (70.7%) of input."},
                    {"q": "What is a time constant and what does it represent?", "a": "τ = RC, time for voltage to reach 63.2% of final value during charge/discharge. After 5τ, effectively complete (99.3%)."}
                ],
                "advanced": [
                    {"q": "Derive the transfer function of a first-order RC low-pass filter.", "a": "H(s) = 1/(1+sRC). Magnitude: 1/√(1+(ωRC)²). Phase: -arctan(ωRC). -20dB/decade rolloff after fc."},
                    {"q": "How would you design a filter with sharper rolloff?", "a": "Cascade multiple stages (but lose 3dB at each), use active filters (Butterworth, Chebyshev), or use LC filters for steeper response."}
                ]
            }
        }

        # Find matching topic (normalize underscores/spaces for matching)
        questions = []
        topic_normalized = topic_lower.replace("_", " ").replace("-", " ")
        for key, levels in questions_db.items():
            key_normalized = key.replace("_", " ").replace("-", " ")
            if key_normalized in topic_normalized or topic_normalized in key_normalized:
                questions = levels.get(skill_level, levels.get("beginner", []))
                break

        if not questions:
            # Generic questions
            questions = [
                {"q": f"Explain the basic principle of {topic}.", "a": "Answer depends on specific topic."},
                {"q": f"What are common applications of {topic}?", "a": "Answer depends on specific topic."},
                {"q": f"What are common mistakes when working with {topic}?", "a": "Answer depends on specific topic."}
            ]

        return {
            "questions": questions,
            "study_tips": [
                "Try to explain concepts in your own words",
                "Draw diagrams to visualize circuits",
                "Practice calculations without calculator first"
            ],
            "focus_areas": focus_areas or [topic]
        }

    @classmethod
    def _generate_concept_summary(cls, topic: str, skill_level: str) -> dict:
        """Generate a concept summary."""
        return {
            "summary": f"Concept summary for {topic} at {skill_level} level",
            "key_points": [
                "Point 1 - to be filled by Gemini based on topic",
                "Point 2",
                "Point 3"
            ],
            "formulas": [],
            "diagrams_needed": True,
            "related_topics": []
        }

    @classmethod
    def _generate_practice_problems(cls, topic: str, skill_level: str) -> dict:
        """Generate practice problems."""
        difficulty_map = {
            "beginner": ["Calculate basic values", "Identify components", "Trace current flow"],
            "intermediate": ["Design simple circuits", "Troubleshoot given scenarios", "Calculate with multiple components"],
            "advanced": ["Optimize designs", "Analyze edge cases", "Design with constraints"]
        }

        return {
            "problem_types": difficulty_map.get(skill_level, difficulty_map["beginner"]),
            "sample_problems": [
                {
                    "problem": f"Sample problem for {topic}",
                    "difficulty": skill_level,
                    "hints": ["Hint 1", "Hint 2"],
                    "answer_format": "Numeric with units"
                }
            ],
            "note": "Gemini should generate specific problems based on topic context"
        }

    @classmethod
    def _generate_quick_review(cls, topic: str, skill_level: str) -> dict:
        """Generate a quick review."""
        return {
            "topic": topic,
            "bullet_points": [
                "Key fact 1",
                "Key fact 2",
                "Common mistake to avoid",
                "Quick formula reference"
            ],
            "mnemonics": [],
            "quick_test": {
                "question": f"Quick check: Can you explain {topic} in one sentence?",
                "expected_keywords": []
            }
        }
