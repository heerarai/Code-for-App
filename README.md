# Code-for-App
# Social Skills Trainer App (Backend)

This is the backend of a web-based Social Skills Trainer app designed to help autistic children and others with special needs improve their social understanding through interactive, scenario-based learning. The project aims to deliver tailored experiences using adaptive difficulty and tone detection systems.

## 🔧 Technologies Used

- **FastAPI** – Python web framework for building APIs
- **Python** – Core language for backend logic
- **Uvicorn** – ASGI server for running FastAPI apps
- **Tone Detection** – Basic NLP model (will be improved using ML in future versions)

## 🌟 Features

- Serves randomized social scenarios (categorized by environment: home, school, friends, etc.)
- Receives user responses and tracks answers
- Adjusts difficulty level dynamically
- Image-based visual learning
- Progress and level tracking (in development)
- Future integration: Enhanced tone detection using NLP/ML (PyTorch)

## 🚀 How to Run Locally

1. **Clone the repository**  
   ```bash
   git clone https://github.com/heerarai/Code-for-App.git
   cd Code-for-App/backend
2. **Install dependencies**  
   (Make sure you’re using a virtual environment)
   ```bash
   pip install -r requirements.txt
3. **Run App**
   ```bash
   uvicorn app:app --reload
4. **Open in Browser**
   ```bash
   Visit: http://127.0.0.1:8000/docs for Swagger API docs

👩‍💻 About the Creator
This app was created by Suhani Rai, a high school student passionate about AI, accessibility, and real-world impact. Inspired by her brother and volunteer work at a special needs clinic, she built this tool to help children practice and improve their social interactions in a supportive way.

📌 Future Plans
- Improve tone detection using PyTorch and NLP models

- Add animated frontend and character visuals

- Save user data and track improvement over time

- Launch full-stack deployment for public access

