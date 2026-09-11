# 🌍 Darukaa Earth | Geospatial Ecosystem & Carbon Analytics Platform

A full-stack geospatial data analytics platform engineered to map, monitor, and analyze carbon sequestration projects and biodiversity metrics across geographical sites using interactive 3D maps and telemetry stream visualizers.

---

## 📸 Application Showcase

![Darukaa Earth Dashboard](./Frontend/src/assets/hero.png)

---

## 🏛️ High-Level System Architecture

Darukaa Earth is built on a modern decoupled architecture separating the interactive geospatial client, the high-concurrency API server, and the spatial PostgreSQL database.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                    │
│  React 18 + Vite  │  Mapbox GL JS (3D GIS)  │  Chart.js Telemetry Stream         │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │  HTTPS / REST API JSON
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                                 BACKEND API                                     │
│  FastAPI (Async Python)  │  SQLAlchemy Async ORM  │  GeoAlchemy2 (Spatial Engine)   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │  PostgreSQL Protocol
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                              SPATIAL DATABASE                                   │
│   PostgreSQL + PostGIS Extension (SRID 4326 WGS84 Spatial Polygon Geometries)   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Overview
* **Frontend SPA**: React 18 with Vite for lightning-fast performance, Mapbox GL JS v3 for rendering high-precision GIS polygon bounding boxes, and custom telemetry charts.
* **Backend API**: FastAPI asynchronous server managing user authentication (Bcrypt hashing), spatial polygon calculations (Shapely), and RESTful endpoints.
* **Geospatial Database**: PostgreSQL equipped with the PostGIS spatial engine, storing polygon geometries (`POLYGON SRID=4326`) and telemetry analytics.

---

## 🗄️ Database Schema Breakdown

The database consists of 4 primary relational entities:

```text
[users] ───< (Auth & RBAC Roles)
[projects] ───1:N───> [sites] (PostGIS Polygons) ───1:N───> [analytics] (Telemetry)
```

### 1. `users` Table
Stores user accounts and system roles for Role-Based Access Control (RBAC).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Indexed | Auto-incrementing user ID |
| `full_name` | `VARCHAR` | NOT NULL | User's full name |
| `email` | `VARCHAR` | Unique, Indexed, NOT NULL | User login email |
| `password` | `VARCHAR` | NOT NULL | Bcrypt hashed password |
| `role` | `VARCHAR` | Default: `'user'` | Role (`'admin'`, `'analyst'`, `'user'`) |
| `created_at` | `TIMESTAMP` | Default: `NOW()` | Registration timestamp |

### 2. `projects` Table
Represents conservation and restoration initiatives.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Indexed | Auto-incrementing project ID |
| `name` | `VARCHAR(255)` | NOT NULL | Project name |
| `description` | `TEXT` | Nullable | Project description / JSON metadata |
| `status` | `VARCHAR(50)` | Default: `'Active'` | Project status (`'Active'`, `'In Progress'`, `'Ended'`) |
| `created_at` | `TIMESTAMP` | Default: `NOW()` | Creation timestamp |

### 3. `sites` Table
Stores spatial GIS boundaries (polygons) assigned to projects.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Indexed | Auto-incrementing site ID |
| `project_id` | `INTEGER` | Foreign Key (`projects.id` ON DELETE CASCADE) | Parent project link |
| `name` | `VARCHAR(255)` | NOT NULL | Site area name |
| `geometry` | `GEOMETRY` | PostGIS Polygon (SRID 4326) | Spatial polygon geometry |
| `created_at` | `TIMESTAMP` | Default: `NOW()` | Mapping timestamp |

### 4. `analytics` Table
Stores carbon score and biodiversity telemetry records for mapped sites.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Indexed | Auto-incrementing telemetry ID |
| `site_id` | `INTEGER` | Foreign Key (`sites.id` ON DELETE CASCADE) | Mapped site link |
| `carbon_score` | `FLOAT` | Check: `0.0 <= carbon_score <= 1.0` | Normalized carbon index |
| `biodiversity_index` | `FLOAT` | Check: `0.0 <= biodiversity_index <= 1.0` | Normalized biodiversity score |
| `recorded_at` | `TIMESTAMP` | Default: `NOW()` | Recording timestamp |

---

## 🔐 Role-Based Access Control (RBAC)

* **Administrator (`role: "admin"`)**: Full management rights to create projects, delete projects, and switch project operational status (`Active`, `In Progress`, `Ended`).
* **Environmental Analyst (`role: "analyst"` / `"user"`)**: Read-only visualization access for exploring project sites, telemetry streams, and interactive maps without deletion rights.

---

## 💻 Environment Setup & Local Installation

### Prerequisites
* **Python 3.10+** installed
* **Node.js 18+** & **npm** installed
* **PostgreSQL** database (Local or Cloud-hosted with PostGIS extension enabled)

---

### 1. Clone Repository

```bash
git clone https://github.com/HardikDhawan9311/Darukaa_Earth-Assignment.git
cd Darukaa_Earth-Assignment
```

---

### 2. Backend Environment Setup

1. **Navigate to Backend directory & create virtual environment**:
   ```bash
   cd Backend
   python -m venv venv
   ```

2. **Activate Virtual Environment**:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables (`Backend/.env`)**:
   Create a `.env` file inside the `Backend` directory:
   ```env
   PORT=8000
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/darukaa_earth
   ```

5. **Start Backend Server**:
   ```bash
   uvicorn main:app --reload
   ```
   * The server runs locally at: `http://localhost:8000`
   * Swagger Interactive API Docs available at: `http://localhost:8000/docs`

---

### 3. Frontend Environment Setup

1. **Navigate to Frontend directory**:
   ```bash
   cd ../Frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`Frontend/.env`)**:
   Create a `.env` file inside the `Frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   * Open browser at: `http://localhost:5173`

---

## 🌐 Live Deployment Links

* **Live Frontend**: [https://darukaa-earth-assignment.vercel.app](https://darukaa-earth-assignment.vercel.app)
* **Live API Backend**: [https://darukaa-earth-assignment.onrender.com](https://darukaa-earth-assignment.onrender.com)
* **API Documentation**: [https://darukaa-earth-assignment.onrender.com/docs](https://darukaa-earth-assignment.onrender.com/docs)
