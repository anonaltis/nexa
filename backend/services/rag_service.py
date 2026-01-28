"""
Light RAG (Retrieval-Augmented Generation) Service

This service provides knowledge retrieval from local files.
No vector database - uses structured YAML files for reliability.

Why Light RAG instead of full RAG:
1. Deterministic - always returns same result for same query
2. No embedding costs
3. Easy to update - just edit YAML files
4. Fast - no vector search latency
5. Transparent - you can see exactly what data exists
"""

import yaml
from pathlib import Path
from typing import Any
import logging

logger = logging.getLogger(__name__)


class RAGService:
    """
    Light RAG service using structured YAML knowledge base.

    Knowledge base structure:
    /knowledge_base/
    ├── datasheets/           # Component specifications
    │   ├── esp32.yaml
    │   ├── arduino_nano.yaml
    │   └── common_components.yaml
    ├── lab_rules/            # Safety and procedures
    │   └── safety_rules.yaml
    └── common_mistakes/      # Error patterns
        ├── beginner_mistakes.yaml
        └── intermediate_mistakes.yaml
    """

    KNOWLEDGE_BASE_PATH = Path(__file__).parent.parent / "knowledge_base"

    def __init__(self):
        """Initialize RAG service and load knowledge base."""
        self._cache: dict[str, Any] = {}
        self._load_knowledge_base()

    def _load_knowledge_base(self):
        """Load all knowledge base files into cache."""
        if not self.KNOWLEDGE_BASE_PATH.exists():
            logger.warning(f"Knowledge base path does not exist: {self.KNOWLEDGE_BASE_PATH}")
            return

        # Load datasheets
        datasheets_path = self.KNOWLEDGE_BASE_PATH / "datasheets"
        if datasheets_path.exists():
            for yaml_file in datasheets_path.glob("*.yaml"):
                try:
                    with open(yaml_file, 'r') as f:
                        data = yaml.safe_load(f)
                        if data:
                            self._cache[f"datasheet:{yaml_file.stem}"] = data
                except Exception as e:
                    logger.error(f"Error loading {yaml_file}: {e}")

        # Load lab rules
        rules_path = self.KNOWLEDGE_BASE_PATH / "lab_rules"
        if rules_path.exists():
            for yaml_file in rules_path.glob("*.yaml"):
                try:
                    with open(yaml_file, 'r') as f:
                        data = yaml.safe_load(f)
                        if data:
                            self._cache[f"rules:{yaml_file.stem}"] = data
                except Exception as e:
                    logger.error(f"Error loading {yaml_file}: {e}")

        # Load common mistakes
        mistakes_path = self.KNOWLEDGE_BASE_PATH / "common_mistakes"
        if mistakes_path.exists():
            for yaml_file in mistakes_path.glob("*.yaml"):
                try:
                    with open(yaml_file, 'r') as f:
                        data = yaml.safe_load(f)
                        if data:
                            self._cache[f"mistakes:{yaml_file.stem}"] = data
                except Exception as e:
                    logger.error(f"Error loading {yaml_file}: {e}")

        logger.info(f"Loaded {len(self._cache)} knowledge base files")

    def search_datasheet(
        self,
        component: str,
        info_type: str = "all"
    ) -> dict[str, Any] | None:
        """
        Search for component datasheet information.

        Args:
            component: Component name (e.g., "ESP32", "LM7805")
            info_type: Type of info ("all", "pinout", "max_ratings", etc.)

        Returns:
            Component data or None if not found
        """
        component_lower = component.lower().replace(" ", "_").replace("-", "_")

        # Check specific component file
        key = f"datasheet:{component_lower}"
        if key in self._cache:
            return self._filter_info(self._cache[key], info_type)

        # Check common_components
        common_key = "datasheet:common_components"
        if common_key in self._cache:
            common_data = self._cache[common_key]
            if component_lower in common_data:
                return self._filter_info(common_data[component_lower], info_type)

            # Fuzzy match
            for key, data in common_data.items():
                if component_lower in key or key in component_lower:
                    return self._filter_info(data, info_type)

        return None

    def _filter_info(self, data: dict, info_type: str) -> dict:
        """Filter data based on requested info type."""
        if info_type == "all":
            return data

        type_mapping = {
            "pinout": ["pinout", "pin_count", "package"],
            "max_ratings": ["max_ratings", "absolute_maximum"],
            "electrical_characteristics": ["electrical_characteristics", "operating_conditions"],
            "typical_application": ["typical_application", "application_notes"]
        }

        if info_type in type_mapping:
            keys = type_mapping[info_type]
            return {k: data.get(k) for k in keys if k in data}

        return data

    def search_lab_rules(
        self,
        category: str
    ) -> dict[str, Any] | None:
        """
        Search for lab safety rules by category.

        Args:
            category: Rule category (e.g., "grounding", "power_supply")

        Returns:
            Rules data or None if not found
        """
        rules_key = "rules:safety_rules"
        if rules_key in self._cache:
            rules_data = self._cache[rules_key]
            if category in rules_data:
                return rules_data[category]

        return None

    def search_common_mistakes(
        self,
        topic: str,
        skill_level: str = "beginner"
    ) -> dict[str, Any] | None:
        """
        Search for common mistakes related to a topic.

        Args:
            topic: Topic to search for
            skill_level: Skill level for filtering

        Returns:
            Mistakes data or None if not found
        """
        mistakes_key = f"mistakes:{skill_level}_mistakes"
        if mistakes_key in self._cache:
            mistakes_data = self._cache[mistakes_key]
            topic_lower = topic.lower()

            for key, data in mistakes_data.items():
                if topic_lower in key.lower() or key.lower() in topic_lower:
                    return data

        # Fall back to beginner mistakes
        if skill_level != "beginner":
            return self.search_common_mistakes(topic, "beginner")

        return None

    def get_all_components(self) -> list[str]:
        """Get list of all known components."""
        components = []

        for key, data in self._cache.items():
            if key.startswith("datasheet:"):
                if key == "datasheet:common_components":
                    components.extend(data.keys())
                else:
                    components.append(key.replace("datasheet:", ""))

        return sorted(set(components))

    def get_all_rule_categories(self) -> list[str]:
        """Get list of all rule categories."""
        rules_key = "rules:safety_rules"
        if rules_key in self._cache:
            return list(self._cache[rules_key].keys())
        return []

    def reload(self):
        """Reload knowledge base from files."""
        self._cache.clear()
        self._load_knowledge_base()


# Singleton instance
_rag_instance: RAGService | None = None


def get_rag_service() -> RAGService:
    """Get singleton RAG service instance."""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGService()
    return _rag_instance
