"""
Knowledge/RAG Functions for Gemini Function Calling

These functions retrieve information from the local knowledge base.
No external API calls - all data is stored locally for reliability.
"""

import yaml
from pathlib import Path
from typing import Any


class KnowledgeFunctions:
    """
    Knowledge retrieval functions (Light RAG).

    These provide Gemini with verified reference data from:
    - Component datasheets
    - Lab safety rules
    - Common mistake patterns
    """

    KNOWLEDGE_BASE_PATH = Path(__file__).parent.parent / "knowledge_base"

    @classmethod
    def _load_yaml(cls, filepath: Path) -> dict | None:
        """Load YAML file safely."""
        try:
            if filepath.exists():
                with open(filepath, 'r') as f:
                    return yaml.safe_load(f)
        except Exception:
            pass
        return None

    @classmethod
    async def fetch_datasheet(
        cls,
        component: str,
        info_type: str = "all"
    ) -> dict[str, Any]:
        """
        Retrieve datasheet information for a component.

        Returns verified specifications from stored datasheets.
        """
        result = {
            "component": component,
            "found": False,
            "source": "ElectroLab Knowledge Base",
            "data": {}
        }

        # Normalize component name
        component_lower = component.lower().replace(" ", "_").replace("-", "_")

        # Try to load from knowledge base
        datasheet_path = cls.KNOWLEDGE_BASE_PATH / "datasheets" / f"{component_lower}.yaml"
        common_path = cls.KNOWLEDGE_BASE_PATH / "datasheets" / "common_components.yaml"

        # Try specific file first
        data = cls._load_yaml(datasheet_path)

        # Fall back to common components
        if not data:
            common_data = cls._load_yaml(common_path)
            if common_data and component_lower in common_data:
                data = common_data[component_lower]
            elif common_data:
                # Fuzzy match
                for key in common_data:
                    if component_lower in key or key in component_lower:
                        data = common_data[key]
                        break

        if data:
            result["found"] = True

            if info_type == "all":
                result["data"] = data
            elif info_type == "pinout":
                result["data"] = {
                    "pinout": data.get("pinout", {}),
                    "pin_count": data.get("pin_count"),
                    "package": data.get("package")
                }
            elif info_type == "max_ratings":
                result["data"] = {
                    "max_ratings": data.get("max_ratings", {}),
                    "absolute_maximum": data.get("absolute_maximum", {})
                }
            elif info_type == "electrical_characteristics":
                result["data"] = {
                    "electrical": data.get("electrical_characteristics", {}),
                    "operating_conditions": data.get("operating_conditions", {})
                }
            elif info_type == "typical_application":
                result["data"] = {
                    "typical_application": data.get("typical_application", {}),
                    "application_notes": data.get("application_notes", [])
                }
        else:
            # Return default/common knowledge for unknown components
            result["data"] = cls._get_default_component_info(component)
            result["source"] = "General Electronics Knowledge"

        return result

    @classmethod
    def _get_default_component_info(cls, component: str) -> dict:
        """Return general knowledge for unknown components."""
        component_lower = component.lower()

        # Common component defaults
        defaults = {
            "led": {
                "forward_voltage": {"red": 1.8, "green": 2.2, "blue": 3.2, "white": 3.2},
                "typical_current": "10-20mA",
                "max_current": "20-30mA",
                "note": "Always use current limiting resistor"
            },
            "resistor": {
                "power_ratings": ["1/8W", "1/4W", "1/2W", "1W", "2W"],
                "tolerance": ["1%", "5%", "10%"],
                "note": "Check power dissipation: P = I²R"
            },
            "capacitor": {
                "types": ["Ceramic", "Electrolytic", "Tantalum", "Film"],
                "note": "Electrolytic capacitors are polarized. Mind the voltage rating."
            }
        }

        for key, info in defaults.items():
            if key in component_lower:
                return info

        return {
            "note": f"Specific datasheet for '{component}' not found. Please provide exact part number.",
            "suggestion": "Check manufacturer website for detailed specifications."
        }

    @classmethod
    async def fetch_lab_rule(
        cls,
        category: str,
        context: str | None = None
    ) -> dict[str, Any]:
        """
        Retrieve laboratory safety rules and best practices.

        Categories: grounding, power_supply, high_voltage, soldering,
                   esd_protection, measurement, general_safety
        """
        result = {
            "category": category,
            "rules": [],
            "warnings": [],
            "best_practices": [],
            "source": "ElectroLab Safety Guidelines"
        }

        # Load safety rules
        rules_path = cls.KNOWLEDGE_BASE_PATH / "lab_rules" / "safety_rules.yaml"
        rules_data = cls._load_yaml(rules_path)

        if rules_data and category in rules_data:
            cat_data = rules_data[category]
            result["rules"] = cat_data.get("rules", [])
            result["warnings"] = cat_data.get("warnings", [])
            result["best_practices"] = cat_data.get("best_practices", [])
        else:
            # Default rules by category
            result.update(cls._get_default_rules(category))

        return result

    @classmethod
    def _get_default_rules(cls, category: str) -> dict:
        """Return default safety rules for a category."""
        default_rules = {
            "grounding": {
                "rules": [
                    "Always connect circuit ground to a common reference point",
                    "Use star grounding topology for mixed-signal circuits",
                    "Keep ground traces wide and short",
                    "Connect oscilloscope ground to circuit ground before measuring"
                ],
                "warnings": [
                    "Floating grounds can cause erratic behavior and measurement errors",
                    "Ground loops can introduce noise in sensitive circuits",
                    "Never connect mains earth directly to circuit ground without isolation"
                ],
                "best_practices": [
                    "Use a ground plane on PCBs",
                    "Verify ground continuity with multimeter before powering on",
                    "Label ground points clearly in schematics"
                ]
            },
            "power_supply": {
                "rules": [
                    "Never exceed component voltage ratings",
                    "Add input and output capacitors to voltage regulators",
                    "Use fuses or current limiting for protection",
                    "Verify polarity before connecting power"
                ],
                "warnings": [
                    "Reverse polarity can destroy components instantly",
                    "Hot-plugging can cause voltage spikes",
                    "Linear regulators waste power as heat"
                ],
                "best_practices": [
                    "Use a current-limited bench supply during development",
                    "Add power LED indicator for visual confirmation",
                    "Implement soft-start for high-current loads"
                ]
            },
            "high_voltage": {
                "rules": [
                    "Never work on live high-voltage circuits",
                    "Discharge capacitors before handling",
                    "Use insulated tools rated for the voltage",
                    "Keep one hand in pocket when probing (one-hand rule)"
                ],
                "warnings": [
                    "Capacitors can hold lethal charge long after power is removed",
                    "High voltage can arc across small gaps",
                    "Wet conditions greatly increase shock risk"
                ],
                "best_practices": [
                    "Use bleeder resistors on HV capacitors",
                    "Post warning signs on HV equipment",
                    "Work with a buddy for HV experiments"
                ]
            },
            "soldering": {
                "rules": [
                    "Work in ventilated area - solder fumes are harmful",
                    "Never touch the tip or recently soldered joints",
                    "Return iron to stand when not in use",
                    "Clean tip frequently with brass wool or wet sponge"
                ],
                "warnings": [
                    "Lead-based solder requires hand washing after use",
                    "Hot solder can splatter",
                    "Overheating damages components and PCBs"
                ],
                "best_practices": [
                    "Use temperature-controlled soldering station",
                    "Pre-tin wires and pads for easier joints",
                    "Apply heat to both pad and lead simultaneously"
                ]
            },
            "esd_protection": {
                "rules": [
                    "Use ESD wrist strap connected to ground",
                    "Store sensitive ICs in anti-static bags",
                    "Handle ICs by edges, not pins",
                    "Discharge yourself before handling components"
                ],
                "warnings": [
                    "CMOS ICs are extremely ESD sensitive",
                    "ESD damage may not be immediately apparent",
                    "Synthetic clothing generates static"
                ],
                "best_practices": [
                    "Use ESD-safe workbench mat",
                    "Ground yourself before opening IC packages",
                    "Keep humidity above 40% in work area"
                ]
            },
            "measurement": {
                "rules": [
                    "Set multimeter to appropriate range before connecting",
                    "Start with highest range if unsure",
                    "Never measure current directly across power supply",
                    "Verify probe calibration periodically"
                ],
                "warnings": [
                    "Measuring resistance on powered circuit gives wrong readings",
                    "Oscilloscope ground clip is connected to earth",
                    "High-frequency signals require proper probes"
                ],
                "best_practices": [
                    "Use 10x probes for oscilloscope measurements",
                    "Compensate probes at start of session",
                    "Document all measurements with conditions"
                ]
            },
            "general_safety": {
                "rules": [
                    "Know location of fire extinguisher and first aid kit",
                    "Never work alone on hazardous experiments",
                    "Keep workspace clean and organized",
                    "Wear safety glasses when cutting or drilling"
                ],
                "warnings": [
                    "Lithium batteries can catch fire if damaged",
                    "Some components contain hazardous materials",
                    "Capacitors can explode if overvoltaged or reversed"
                ],
                "best_practices": [
                    "Review circuit before powering on",
                    "Start with low voltage/current and increase gradually",
                    "Document your work for future reference"
                ]
            }
        }

        return default_rules.get(category, {
            "rules": ["No specific rules found for this category"],
            "warnings": [],
            "best_practices": ["Consult instructor for guidance"]
        })

    @classmethod
    async def fetch_common_mistake(
        cls,
        topic: str,
        skill_level: str = "beginner"
    ) -> dict[str, Any]:
        """
        Retrieve common mistakes for a topic.

        Used for proactive warnings and teaching moments.
        """
        result = {
            "topic": topic,
            "skill_level": skill_level,
            "mistakes": [],
            "prevention_tips": [],
            "source": "ElectroLab Learning Database"
        }

        # Load mistakes database
        mistakes_path = cls.KNOWLEDGE_BASE_PATH / "common_mistakes" / f"{skill_level}_mistakes.yaml"
        mistakes_data = cls._load_yaml(mistakes_path)

        if mistakes_data:
            # Find topic in data
            topic_lower = topic.lower()
            for key, data in mistakes_data.items():
                if topic_lower in key.lower() or key.lower() in topic_lower:
                    result["mistakes"] = data.get("mistakes", [])
                    result["prevention_tips"] = data.get("prevention", [])
                    break

        if not result["mistakes"]:
            # Return default common mistakes
            result.update(cls._get_default_mistakes(topic, skill_level))

        return result

    @classmethod
    def _get_default_mistakes(cls, topic: str, skill_level: str) -> dict:
        """Return default common mistakes for a topic."""
        topic_lower = topic.lower()

        # Topic-specific defaults
        mistake_db = {
            "led": {
                "mistakes": [
                    {"mistake": "Forgetting current limiting resistor", "consequence": "LED burns out instantly", "fix": "Always calculate and add series resistor"},
                    {"mistake": "Reversing LED polarity", "consequence": "LED won't light (usually no damage)", "fix": "Longer leg is anode (+), connect to positive through resistor"},
                    {"mistake": "Using wrong resistor value", "consequence": "Dim LED or burned LED", "fix": "Calculate: R = (Vs - Vf) / If"}
                ],
                "prevention": [
                    "Always draw schematic before building",
                    "Double-check LED orientation - flat side/short leg is cathode (-)",
                    "Use 220-330Ω resistor for 5V supply as safe default"
                ]
            },
            "power_supply": {
                "mistakes": [
                    {"mistake": "Reverse polarity connection", "consequence": "Instant component damage", "fix": "Use polarized connectors, double-check before powering"},
                    {"mistake": "Missing decoupling capacitors", "consequence": "Noise, instability, random resets", "fix": "Add 0.1µF ceramic near every IC"},
                    {"mistake": "Exceeding regulator input voltage", "consequence": "Excessive heat, regulator failure", "fix": "Check datasheet for max Vin"}
                ],
                "prevention": [
                    "Add protection diode for reverse polarity",
                    "Use bench supply with current limit during testing",
                    "Calculate power dissipation: P = (Vin - Vout) × I"
                ]
            },
            "grounding": {
                "mistakes": [
                    {"mistake": "Floating ground / no common ground", "consequence": "Erratic behavior, wrong measurements", "fix": "Connect all grounds to single reference point"},
                    {"mistake": "Ground loops in analog circuits", "consequence": "Noise, hum, offset errors", "fix": "Use star grounding, avoid loops"},
                    {"mistake": "Mixing analog and digital grounds incorrectly", "consequence": "Digital noise in analog signals", "fix": "Separate grounds, join at single point"}
                ],
                "prevention": [
                    "Always verify ground continuity first",
                    "Draw ground connections explicitly in schematic",
                    "Use ground plane on PCBs"
                ]
            },
            "oscilloscope": {
                "mistakes": [
                    {"mistake": "Ground clip connected to wrong point", "consequence": "Short circuit, damaged equipment", "fix": "Scope ground = circuit ground = earth"},
                    {"mistake": "Using 1x probe for high frequency", "consequence": "Distorted waveforms, wrong readings", "fix": "Use 10x probe, compensate before use"},
                    {"mistake": "Wrong vertical scale", "consequence": "Clipped or invisible signals", "fix": "Start with auto-scale, then adjust"}
                ],
                "prevention": [
                    "Attach ground clip before signal probe",
                    "Compensate probes at start of session",
                    "Use AC coupling for signals with DC offset"
                ]
            },
            "microcontroller": {
                "mistakes": [
                    {"mistake": "Exceeding GPIO current limits", "consequence": "Damaged pins or MCU", "fix": "Use transistor/MOSFET for high current loads"},
                    {"mistake": "Missing pull-up/pull-down resistors", "consequence": "Floating inputs, unreliable readings", "fix": "Use internal pull-ups or add external 10kΩ"},
                    {"mistake": "No decoupling capacitor", "consequence": "Random resets, erratic behavior", "fix": "Add 0.1µF ceramic between Vcc and GND"}
                ],
                "prevention": [
                    "Check datasheet for GPIO specifications",
                    "Never connect 5V signals to 3.3V MCU directly",
                    "Use level shifters between different voltage domains"
                ]
            },
            "resistor": {
                "mistakes": [
                    {"mistake": "Misreading color code", "consequence": "Wrong value, circuit doesn't work", "fix": "Use multimeter to verify, learn color code mnemonics"},
                    {"mistake": "Ignoring power rating", "consequence": "Resistor overheats, burns, fire risk", "fix": "Calculate P = I²R, use appropriate wattage"},
                    {"mistake": "Using carbon film in precision circuits", "consequence": "Temperature drift, noise", "fix": "Use metal film resistors for precision"}
                ],
                "prevention": [
                    "Always verify resistance with multimeter",
                    "Calculate power dissipation for every resistor",
                    "Derate by 50% for reliable operation"
                ]
            },
            "capacitor": {
                "mistakes": [
                    {"mistake": "Reversing electrolytic capacitor", "consequence": "Capacitor explodes", "fix": "Check polarity marking, negative stripe = cathode"},
                    {"mistake": "Exceeding voltage rating", "consequence": "Failure, possible explosion", "fix": "Use caps rated 20-50% above operating voltage"},
                    {"mistake": "Using electrolytic for high frequency", "consequence": "Poor filtering, ESR issues", "fix": "Use ceramic for high frequency bypass"}
                ],
                "prevention": [
                    "Mark polarity on schematic clearly",
                    "Use ceramic + electrolytic in parallel for wide bandwidth",
                    "Check ESR for electrolytic capacitors"
                ]
            }
        }

        topic_normalized = topic_lower.replace("_", " ").replace("-", " ")
        for key, data in mistake_db.items():
            key_normalized = key.replace("_", " ").replace("-", " ")
            if key_normalized in topic_normalized or topic_normalized in key_normalized:
                # Filter by skill level
                if skill_level == "beginner":
                    return data
                elif skill_level == "intermediate":
                    # Add more technical details
                    data["prevention"].append("Review relevant application notes")
                    return data
                else:  # advanced
                    data["prevention"].append("Consider edge cases and failure modes")
                    return data

        return {
            "mistakes": [
                {"mistake": "General: Not reading datasheet", "consequence": "Exceeded ratings, wrong connections", "fix": "Always check component datasheet first"}
            ],
            "prevention": ["Start simple, add complexity gradually", "Document your work"]
        }
