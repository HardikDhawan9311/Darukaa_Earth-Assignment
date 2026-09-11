# 🌍 Darukaa.Earth

A full-stack geospatial data analytics platform to manage, visualize, and analyze carbon and biodiversity projects.

---

## 🚀 Features

- 📊 Interactive dashboard for managing projects
- 🗺️ Map-based visualization of geographical sites
- 📈 Analytics for carbon score & biodiversity index
- 🔐 Authentication system
- ⚡ High-performance backend using FastAPI
- 🗄️ PostgreSQL database integration

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS

### Backend
- FastAPI (Python)

### Database
- PostgreSQL

### Deployment
- Vercel (Frontend)
- Render (Backend & DB)

---


## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Darukaa_Earth.git
cd Darukaa_Earth

```

### 2. Backend Setup
```bash
cd Backend
```

1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

2.  **Activate the virtual environment:**
    -   **Windows:**
        ```bash
        venv\Scripts\activate
        ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

Start the development server with:
```bash
uvicorn main:app --reload
```

### 2.1 Setup of Backend Env 
  Create a file as .env in Backend Directory
  .env file 
  ```
  DATABASE_URL=postgresql+asyncpg://postgres:[user]%409311@localhost:[port]/darukaa_earth

  ```


### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
### 3.1 Setup of Backend Env 
  Create a file as .env in Frontend Directory
  .env file 
  ```
  VITE_MAPBOX_TOKEN=MAP BOX DEFAULT PUBLIC KEY
  ```

### 4 API ENDPOINTS OF BACKEND 
 Hosted on Render - https://darukaa-earth-backend.onrender.com/docs
