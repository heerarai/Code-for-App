from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model.tone_classifier import detect_tone

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

class ChoiceRequest(BaseModel):
  choice: str

@app.post("/evaluate_choice")
async def evaluate_choice(request: ChoiceRequest):
  choice = request.choice
  if choice == 'B':
    feedback = "That's right! Saying hi shows you're friendly."
  elif choice == 'A':
    feedback = "Hmm, ignoring might make your friend feel sad."
  else:
    feedback = "Walking away can seem unfriendly."
  tone = detect_tone(choice)
  return {"feedback": feedback, "detected_tone": tone}
