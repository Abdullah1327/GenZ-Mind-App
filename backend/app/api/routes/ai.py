from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class QuizGenerationRequest(BaseModel):
    course: str
    topic: str
    difficulty: str  # beginner | intermediate | advanced
    number_of_questions: int
    quiz_type: str  # mcq | true_false | short_answer | mixed
    user_id: Optional[str] = None


class AssignmentGenerationRequest(BaseModel):
    course: str
    topic: str
    student_level: str  # beginner | intermediate | advanced
    assignment_type: str  # theory | practical | coding | research | project_based | mixed
    difficulty: str  # easy | medium | hard
    instructor_id: Optional[str] = None


def build_quiz_prompt(request: QuizGenerationRequest) -> str:
    """Build the LLM prompt for quiz generation."""
    return f"""Generate {request.number_of_questions} {request.quiz_type.upper()} questions about "{request.topic}" in {request.course}.
Difficulty: {request.difficulty}

Return a JSON array where each question has:
- "question": the question text
- "options": array of 4 choices (for MCQ), ["True", "False"] for True/False, null for short answer
- "correct_answer": the correct answer
- "explanation": a brief explanation of why the answer is correct

Return ONLY valid JSON, no extra text."""


def build_assignment_prompt(request: AssignmentGenerationRequest) -> str:
    """Build the LLM prompt for assignment generation."""
    return f"""Create a structured {request.assignment_type} assignment about "{request.topic}" in {request.course}.
Student Level: {request.student_level} | Difficulty: {request.difficulty}

Return a JSON object with:
- "title": Assignment title
- "objective": What students will learn
- "scenario": Context/background for the assignment
- "task_requirements": Array of numbered requirements
- "instructions": Step-by-step instructions
- "deliverables": Array of required submissions
- "evaluation_criteria": Array of objects with "name" and "percentage" fields

Return ONLY valid JSON, no extra text."""


@router.post("/generate-quiz")
async def generate_quiz(request: QuizGenerationRequest):
    """
    Generate an AI quiz.
    Phase 3 TODO: Connect to LLM provider (Groq/OpenAI) using build_quiz_prompt()
    """
    # TODO Phase 3: Connect LLM
    # from app.services.llm_service import call_llm
    # prompt = build_quiz_prompt(request)
    # questions = await call_llm(prompt, response_format="json")

    # Mock response for development
    mock_questions = [
        {
            "question": f"Sample question about {request.topic} (Question 1)",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A",
            "explanation": "This is a placeholder explanation. Connect an LLM to get real AI-generated questions.",
        }
        for i in range(min(request.number_of_questions, 3))
    ]

    return {
        "status": "success",
        "course": request.course,
        "topic": request.topic,
        "difficulty": request.difficulty,
        "quiz_type": request.quiz_type,
        "questions": mock_questions,
        "note": "Mock response — connect LLM in Phase 3",
    }


@router.post("/generate-assignment")
async def generate_assignment(request: AssignmentGenerationRequest):
    """
    Generate an AI assignment.
    Phase 4 TODO: Connect to LLM provider using build_assignment_prompt()
    """
    # TODO Phase 4: Connect LLM
    # from app.services.llm_service import call_llm
    # prompt = build_assignment_prompt(request)
    # content = await call_llm(prompt, response_format="json")

    # Mock response for development
    mock_content = {
        "title": f"{request.topic} — {request.assignment_type.replace('_', ' ').title()} Assignment",
        "objective": f"Students will develop an understanding of {request.topic} concepts at the {request.student_level} level.",
        "scenario": f"In this assignment, you will explore {request.topic} in the context of {request.course}.",
        "task_requirements": [
            f"Requirement 1: Understand the fundamentals of {request.topic}",
            "Requirement 2: Apply the concepts in a practical exercise",
            "Requirement 3: Document your findings",
        ],
        "instructions": "Follow the requirements above and submit your work by the deadline.",
        "deliverables": ["Python Notebook / Source Code", "Written Report (PDF)", "Screenshots of results"],
        "evaluation_criteria": [
            {"name": "Implementation", "percentage": 40},
            {"name": "Correctness", "percentage": 30},
            {"name": "Documentation", "percentage": 20},
            {"name": "Creativity", "percentage": 10},
        ],
        "note": "Mock response — connect LLM in Phase 4",
    }

    return {
        "status": "success",
        "course": request.course,
        "topic": request.topic,
        "content": mock_content,
    }
