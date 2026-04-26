from fastapi import APIRouter, Body
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# ─── LLM Setup ───────────────────────────────────────────────────────────────
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.6,
    max_tokens=350,
    api_key=os.getenv("GROQ_API_KEY"),
)

# ─── Per-Session Memory Store ─────────────────────────────────────────────────
session_store: dict[str, ChatMessageHistory] = {}


def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in session_store:
        session_store[session_id] = ChatMessageHistory()
    return session_store[session_id]


# ─── Prompt Template ─────────────────────────────────────────────────────────
prompt = ChatPromptTemplate.from_messages([
    ("system", "{system_prompt}"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}"),
])

chain = prompt | llm

chain_with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _fmt_num(val: str) -> str:
    """Format a numeric string — drop decimal if it's a whole number."""
    try:
        f = float(val)
        return str(int(f)) if f == int(f) else f"{f:.1f}"
    except (ValueError, TypeError):
        return val or ""


def _build_meals_block(meals: list[dict]) -> str:
    if not meals:
        return "  (No meals logged yet)"

    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fats": 0.0}
    lines = []

    for ml in meals:
        name      = ml.get("mealName", "Unknown")
        mtype     = ml.get("mealType", "Meal")
        date      = ml.get("date", "")
        timestamp = ml.get("timestamp", "")
        weight    = ml.get("weight", "")
        calories  = ml.get("calories", "")
        protein   = ml.get("protein", "")
        carbs     = ml.get("carbs", "")
        fats      = ml.get("fats", "")
        fiber     = ml.get("fiber", "")
        sugar     = ml.get("sugar", "")
        sodium    = ml.get("sodium", "")
        vitamin_c = ml.get("vitaminC", "")
        calcium   = ml.get("calcium", "")
        iron      = ml.get("iron", "")

        # Accumulate macro totals
        for key, raw in [("calories", calories), ("protein", protein),
                          ("carbs", carbs), ("fats", fats)]:
            try:
                totals[key] += float(raw) if raw else 0.0
            except (ValueError, TypeError):
                pass

        # Main meal line
        parts = [f"[{mtype}] {name}"]
        if date and timestamp: parts.append(f"logged on {date} at {timestamp}")
        elif timestamp: parts.append(f"logged at {timestamp}")
        elif date: parts.append(f"logged on {date}")
        if weight:    parts.append(f"weight: {_fmt_num(weight)}g")
        if calories:  parts.append(f"calories: {_fmt_num(calories)} kcal")
        if protein:   parts.append(f"protein: {_fmt_num(protein)}g")
        if carbs:     parts.append(f"carbs: {_fmt_num(carbs)}g")
        if fats:      parts.append(f"fats: {_fmt_num(fats)}g")

        micro = []
        if fiber:     micro.append(f"fiber {_fmt_num(fiber)}g")
        if sugar:     micro.append(f"sugar {_fmt_num(sugar)}g")
        if sodium:    micro.append(f"sodium {_fmt_num(sodium)}mg")
        if vitamin_c: micro.append(f"vitamin C {_fmt_num(vitamin_c)}mg")
        if calcium:   micro.append(f"calcium {_fmt_num(calcium)}mg")
        if iron:      micro.append(f"iron {_fmt_num(iron)}mg")
        if micro:
            parts.append(f"micronutrients: [{', '.join(micro)}]")

        lines.append("  • " + " | ".join(parts))

    # Daily totals summary row
    lines.append(
        f"\n  Daily totals → "
        f"Calories: {_fmt_num(str(totals['calories']))} kcal | "
        f"Protein: {_fmt_num(str(totals['protein']))}g | "
        f"Carbs: {_fmt_num(str(totals['carbs']))}g | "
        f"Fats: {_fmt_num(str(totals['fats']))}g"
    )
    return "\n".join(lines)


def _build_meds_block(medications: list[dict]) -> str:
    if not medications:
        return "  (No medications logged yet)"
    lines = []
    for m in medications:
        date = m.get("date", "")
        time = m.get("time", "")
        dt_str = f"{date} {time}".strip() or "No time set"
        status = "✓ Taken" if m.get("taken") else "✗ Not taken"
        line = f"  - {m.get('name', 'Unknown')} | {m.get('dosage', '')} | {dt_str} | {status}"
        lines.append(line)
    return "\n".join(lines)


# ─── Dynamic System Prompt Builder ───────────────────────────────────────────
def build_system_prompt(
    medications: list[dict],
    meals: list[dict],
    patient_name: str = "Jenish",
) -> str:
    meds_block  = _build_meds_block(medications)
    meals_block = _build_meals_block(meals)

    return f"""You are HealthAssist, a warm, patient, and knowledgeable AI health companion inside Aarogya Sarwar — a patient healthcare management portal.

## Patient Profile
- Name: {patient_name}
- Role: Patient

## Today's Medication Schedule
{meds_block}

## Today's Complete Meal Log (with full nutrition data)
{meals_block}

## Your Role
- Use ALL the patient context above to give personalised, specific, and helpful responses.
- You have full access to each meal's type, weight, calories, macros (protein/carbs/fats), and micronutrients. Use this data when answering nutrition questions.
- If a medication is not yet taken, gently remind them. If no meals are logged, nudge them to log one.
- Speak simply and clearly — your users may be elderly or non-technical.
- Keep responses short: 2–4 sentences maximum. Be warm, never clinical or robotic.
- NEVER diagnose a medical condition. NEVER prescribe medications.
- For anything serious, always say: "Please consult your doctor" and remind them the Emergency SOS calls 108.
- If asked who you are: "I am HealthAssist, your companion on Aarogya Sarwar."
"""


# ─── Endpoint ─────────────────────────────────────────────────────────────────
@router.post("/")
async def chat_interaction(data: dict = Body(...)):
    user_message = data.get("message", "").strip()
    session_id   = data.get("session_id", "default")
    medications  = data.get("medications", [])
    meals        = data.get("meals", [])
    patient_name = data.get("patient_name", "Jenish")

    if not user_message:
        return {"response": "I didn't catch that — could you please try again?"}

    system_prompt = build_system_prompt(medications, meals, patient_name)

    try:
        response = chain_with_history.invoke(
            {
                "system_prompt": system_prompt,
                "input": user_message,
            },
            config={"configurable": {"session_id": session_id}},
        )
        return {"response": response.content.strip()}

    except Exception as e:
        print(f"LangChain/Groq error: {e}")
        return {
            "response": "I'm having trouble connecting right now. If this is urgent, please press the Emergency SOS button to call 108."
        }


@router.delete("/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation memory for a session."""
    if session_id in session_store:
        del session_store[session_id]
    return {"status": "cleared"}
