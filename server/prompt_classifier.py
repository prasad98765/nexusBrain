import re
from typing import Dict, List, Tuple, Optional
import logging
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

logger = logging.getLogger(__name__)

class PromptClassifier:
    def __init__(self):
        # Initialize embedding model for semantic classification
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Define profile patterns and keywords
        self.profile_patterns = {
            "teacher": {
                "keywords": [
                    "explain", "teach", "understand", "concept", "learn",
                    "tutorial", "guide", "education", "lesson", "clarify",
                    "what is", "how does", "why does", "help me understand",
                    # New for visual/diagram requests
                    "diagram", "visualize", "chart", "illustration", "sketch", 
                    "draw this", "image explanation", "infographic"
                ],
                "patterns": [
                    r"explain\s+(?:to me|how|why)",
                    r"what\s+(?:is|are|does)",
                    r"help\s+(?:me)?\s*understand",
                    r"can\s+you\s+teach",
                    r"(?:make|generate|draw)\s+(?:a\s+)?diagram"
                ],
                "embedding_examples": [
                    "Explain this concept to me",
                    "Help me understand this topic",
                    "What is the meaning of this term",
                    "Teach me about this subject",
                    "Draw a diagram of this process"
                ]
            },
            "coder": {
                "keywords": [
                    "code", "program", "function", "bug", "error",
                    "debug", "implement", "algorithm", "api", "class",
                    "module", "library", "framework", "syntax", "compile",
                    # New for coding-related visuals
                    "flowchart", "uml diagram", "architecture diagram", "visual code"
                ],
                "patterns": [
                    r"(?:write|create|implement)\s+(?:a|the)?\s*(?:function|code|program)",
                    r"(?:fix|debug)\s+(?:this)?\s*(?:code|error|bug)",
                    r"(?:how\s+to|help\s+(?:me)?\s+with)\s+coding",
                    r"(?:draw|make)\s+(?:a\s+)?(flowchart|uml|diagram)"
                ],
                "embedding_examples": [
                    "Help me fix this code",
                    "Write a function to solve this problem",
                    "Debug this programming error",
                    "Implement this algorithm",
                    "Generate a UML diagram for this class"
                ]
            },
            "summarizer": {
                "keywords": [
                    "summarize", "summary", "brief", "overview", "tldr",
                    "key points", "main ideas", "recap", "condense", "shorten",
                    # New for visual summaries
                    "infographic", "visual summary", "chart summary", "diagram overview"
                ],
                "patterns": [
                    r"(?:can\s+you)?\s*summarize",
                    r"give\s+(?:me)?\s*(?:a|the)?\s*summary",
                    r"tldr",
                    r"what\s+are\s+the\s+key\s+points",
                    r"(?:visual|image)\s+summary"
                ],
                "embedding_examples": [
                    "Summarize this text for me",
                    "Give me the main points",
                    "Provide a brief overview",
                    "What are the key takeaways",
                    "Create an infographic summary"
                ]
            },
            "fact_checker": {
                "keywords": [
                    "verify", "fact", "check", "accurate", "truth",
                    "source", "evidence", "proof", "validate", "correct",
                    # Visual fact checking
                    "image authenticity", "is this picture real", "verify photo", 
                    "deepfake check", "visual fact check"
                ],
                "patterns": [
                    r"(?:is|are)\s+(?:this|these|that|those)\s+(?:fact|statement).?\s*(?:true|correct|accurate)",
                    r"(?:can\s+you)?\s*verify",
                    r"(?:what\s+are)?\s*the\s+facts",
                    r"(?:verify|check)\s+(?:this)?\s*(?:image|photo|picture)"
                ],
                "embedding_examples": [
                    "Verify if this information is correct",
                    "Fact check this statement",
                    "Is this actually true",
                    "What's the evidence for this claim",
                    "Check if this image is real"
                ]
            },
            "creative": {
                "keywords": [
                    "create", "creative", "story", "imagine", "generate",
                    "design", "innovative", "unique", "artistic", "write",
                    # New for generative images
                    "prompt", "image", "picture", "drawing", "illustration",
                    "digital art", "painting", "fantasy scene", "sci-fi concept",
                    "one line prompt", "five line prompt", "30 line prompt",
                    "photorealistic", "render", "3d art", "pixel art"
                ],
                "patterns": [
                    r"(?:write|create)\s+(?:a|an)?\s*(?:story|poem|creative|image prompt)",
                    r"(?:help\s+me)?\s*(?:be|get)\s*creative",
                    r"imagine\s+(?:if|what|how)",
                    r"(?:generate|make|draw)\s+(?:an?\s+)?(?:image|art|picture|prompt)"
                ],
                "embedding_examples": [
                    "Write a creative story",
                    "Help me brainstorm ideas",
                    "Create something unique",
                    "Design something innovative",
                    "Generate a one-line art prompt",
                    "Give me a 5-line prompt for image generation",
                    "Write a 30-line descriptive prompt for AI art"
                ]
            }
        }
        
        # Pre-compute embeddings for examples
        self.profile_embeddings = {}
        for profile, data in self.profile_patterns.items():
            examples = data["embedding_examples"]
            embeddings = self.embedding_model.encode(examples)
            self.profile_embeddings[profile] = np.mean(embeddings, axis=0)

    def _check_keywords(self, text: str, profile_data: Dict) -> int:
        """Count keyword matches for a profile"""
        text = text.lower()
        count = sum(1 for keyword in profile_data["keywords"] if keyword in text)
        return count

    def _check_patterns(self, text: str, profile_data: Dict) -> int:
        """Count pattern matches for a profile"""
        text = text.lower()
        count = sum(1 for pattern in profile_data["patterns"] if re.search(pattern, text))
        return count

    def _get_semantic_similarity(self, text: str, profile: str) -> float:
        """Calculate semantic similarity with profile examples"""
        text_embedding = self.embedding_model.encode([text])[0]
        profile_embedding = self.profile_embeddings[profile]
        similarity = cosine_similarity([text_embedding], [profile_embedding])[0][0]
        return similarity

    def classify_prompt(self, text: str, threshold: float = 0.6) -> Tuple[str, float]:
        """
        Classify the prompt into the most appropriate agent profile
        Returns: (profile_name, confidence_score)
        """
        scores = {}
        
        for profile, data in self.profile_patterns.items():
            # Calculate various scores
            keyword_score = self._check_keywords(text, data) * 0.3
            pattern_score = self._check_patterns(text, data) * 0.3
            semantic_score = self._get_semantic_similarity(text, profile) * 0.4
            
            # Combine scores
            total_score = keyword_score + pattern_score + semantic_score
            scores[profile] = total_score
        
        # Get best match
        best_profile = max(scores.items(), key=lambda x: x[1])
        
        if best_profile[1] >= threshold:
            logger.info(f"Classified prompt as {best_profile[0]} with score {best_profile[1]:.2f}")
            return best_profile
        else:
            logger.info(f"No clear profile match, defaulting to general with score {best_profile[1]:.2f}")
            return ("general", best_profile[1])

# Global instance
prompt_classifier = PromptClassifier()
