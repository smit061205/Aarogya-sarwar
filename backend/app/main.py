from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import medications, meals, chat

app = FastAPI(title="Aarogya Sarwar API")

# Configure CORS for local React Vite setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(medications.router, prefix="/api/medications", tags=["Medications"])
app.include_router(meals.router, prefix="/api/meals", tags=["Meals"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
async def root():
    return {"message": "Welcome to Aarogya Sarwar Backend"}
