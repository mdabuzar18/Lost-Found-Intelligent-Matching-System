# Lost & Found Intelligent Matching System

An automated multi-modal matching platform designed for airports, railway transit hubs, universities, shopping malls, and large venues. 

Unlike traditional lost-and-found databases that rely on exact keyword queries, this system automatically computes semantic similarities across **Sentence-BERT text embeddings**, **CLIP visual feature vectors**, **Haversine geospatial proximity decay**, and **temporal decay**, generating a single unified **confidence match score (0–100%)**.

---

## 🌟 Key Features

1. **Multi-Modal AI Matching Engine**:
   - **Text Semantics**: 384-dimensional dense vectors using Sentence-BERT (`all-MiniLM-L6-v2`) to capture context (e.g. matching *"black Samsonite laptop bag"* with *"lost dark computer case"*).
   - **Image Similarity**: 512-dimensional CLIP embeddings (`clip-ViT-B-32`) to compare item photos visually with continuous color, geometry, and spatial projection fallbacks.
   - **Geospatial Proximity**: Great-circle Haversine decay $\max(0, 1 - \frac{d_{\text{km}}}{5.0})$ plus token-level indoor venue matching.
   - **Temporal Decay**: Configurable time window decay $\max(0, 1 - \frac{|\Delta t|_{\text{days}}}{14.0})$.
   - **Dynamic Weight Fusion**:
     - *With photo on both*: Text (35%) + Vision (35%) + Location (15%) + Time (15%).
     - *Without photo*: Text (60%) + Location (20%) + Time (20%).

2. **Automated Background Matching**:
   - As soon as a report is filed, post-save signals trigger background candidate matching with cheap pre-filtering (opposite report type, `status='OPEN'`, same category, $\pm 14$-day window).

3. **Dual-Database Support**:
   - **PostgreSQL + pgvector**: Production-ready vector indexing with HNSW/IVFFlat algorithms.
   - **SQLite Dev Mode**: Default local mode with zero external dependencies, computing vectorized cosine similarity via NumPy.

4. **Staff Verification & Chain of Custody (Claims Desk)**:
   - Match confirmation, claimant identity validation, verification notes (serial number, distinctive marks), and one-click item release.

5. **Tamper-Evident Audit Trail**:
   - Complete tracking of report creation, score calculation events, staff decisions, and custody handovers.

6. **Modern User Experience**:
   - Ultra-clean dark theme dashboard built with React, Vite, Tailwind CSS, and Lucide icons.
   - Also directly servable from Django (`http://127.0.0.1:8000/`)!

---

## 🏗️ System Architecture

```
                               ┌────────────────────────┐
                               │   React + Vite Client  │
                               │ (Tailwind + Lucide UI) │
                               └───────────┬────────────┘
                                           │ REST API
                                           ▼
                               ┌────────────────────────┐
                               │   Django REST API      │
                               │      (DRF 3.17)        │
                               └───────────┬────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│ Sentence-BERT    │             │  CLIP Vision     │             │  Matching Engine │
│ all-MiniLM-L6-v2 │             │  clip-ViT-B-32   │             │  4-Way Weighted  │
│ (384 Dimensions) │             │ (512 Dimensions) │             │  Confidence (0%) │
└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘
         │                                │                                │
         └────────────────────────────────┼────────────────────────────────┘
                                          ▼
                               ┌────────────────────────┐
                               │ Storage Layer:         │
                               │ • Postgres + pgvector  │
                               │ • SQLite (Dev fallback)│
                               │ • Media Folder / S3    │
                               └────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.12+ (or 3.10+)
- Node.js 18+ (optional, frontend is pre-built into `frontend/dist`)

### 1. Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Activate virtual environment
source venv/bin/activate

# 3. Apply database migrations
python manage.py migrate

# 4. Seed realistic demo scenarios (Airport, University, Mall)
python manage.py seed_data

# 5. Run the server
python manage.py runserver 8000
```

The application is now live at **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**!
- Admin panel: **[http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)** (Username: `admin`, Password: `admin123`)
- REST API Root: **[http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)**

---

### 2. Frontend Development (Optional for Hot-Reloading)

If you want to edit the React frontend with Vite hot-reloading:

```bash
cd frontend
npm run dev
```

Visit **[http://localhost:3000/](http://localhost:3000/)** (proxies API requests to port 8000).

---

## 🗄️ Database Schema & Models

| Model | Fields & Descriptions | Indexes |
|---|---|---|
| **User** | `id`, `name`, `email`, `phone`, `role` (`staff`/`public`), `created_at` | `email` (unique) |
| **Report** | `report_type` (`LOST`/`FOUND`), `category`, `title`, `description`, `image`, `image_embedding` (512-dim), `text_embedding` (384-dim), `location_name`, `latitude`, `longitude`, `event_datetime`, `status` (`OPEN`/`MATCHED`/`CLAIMED`/`CLOSED`) | `(report_type, status)`, `location_name`, `event_datetime`, `category` |
| **MatchCandidate** | `lost_report`, `found_report`, `image_similarity_score`, `text_similarity_score`, `location_score`, `time_score`, `final_confidence_score` (0–100), `status` (`SUGGESTED`/`CONFIRMED`/`REJECTED`) | `unique(lost_report, found_report)` |
| **Claim** | `match_candidate`, `found_report`, `claimant`, `verification_notes`, `status` (`PENDING`/`APPROVED`/`REJECTED`), `resolved_at` | `created_at` |
| **AuditLog** | `action`, `performed_by`, `report_reference`, `match_reference`, `claim_reference`, `details` (JSON), `timestamp` | `timestamp`, `action` |

---

## 🐘 PostgreSQL + pgvector Deployment

To switch to PostgreSQL with the `pgvector` extension:

1. **Start PostgreSQL with pgvector using Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **Configure environment variable**:
   In `backend/.env` (or shell):
   ```bash
   export USE_POSTGRES=True
   export DB_NAME=lostfound_db
   export DB_USER=postgres
   export DB_PASSWORD=postgrespassword
   export DB_HOST=localhost
   export DB_PORT=5432
   ```

3. **Run migrations & seed data**:
   ```bash
   python manage.py migrate
   python manage.py seed_data
   ```

---

## 🧪 Automated Test Suite

Run the full Django test suite:

```bash
cd backend
python manage.py test matching_system
```

All 8 tests cover:
- Sentence-BERT and CLIP cosine similarity bounds
- Haversine spherical coordinate distance decay
- Tokenized indoor location matching
- Temporal proximity decay
- Problem statement classic scenario verification (>60% confidence)
- Cheap pre-filter negative control (different categories must not match)
- Claim verification lifecycle and status transitions
- Comprehensive Audit Log trail verification

---

## 🎤 Viva / Demonstration Walkthrough Script

When demonstrating this project for an evaluation or interview:

1. **Open Dashboard**:
   Navigate to `http://127.0.0.1:8000/`. Point out the **AI Matches Tab** showing seeded airport pairs.
2. **Explain the Problem Statement**:
   Highlight the **Samsonite bag** match:
   - Lost: *"Lost black laptop bag at Gate 3"*
   - Found: *"Black Samsonite laptop bag, small scratch near handle, found near Gate 3"*
   - Show how standard SQL `LIKE '%...'` would fail, but our system achieved a **high-confidence match**!
3. **Inspect the 4-Way Sub-Scores**:
   Click **"Side-by-Side"** on any match card to open the modal:
   - Show the Text Cosine Similarity (Sentence-BERT).
   - Show the Image Visual Similarity (CLIP).
   - Show the Location Proximity (100% due to Gate 3 coordinates).
   - Show the Temporal Proximity (99% due to 15-minute window).
4. **Demonstrate Claim Verification**:
   - Click **"Confirm Match"** to change status to `CONFIRMED`.
   - Switch to the **Claims Desk** tab.
   - Review claimant ownership notes (serial number / passcode).
   - Click **"Verify & Approve Handover"**; observe the item state transitioning to `CLAIMED`.
5. **Show the Audit Trail**:
   Switch to the **Audit Trail** tab to demonstrate the complete timestamped security log for regulatory compliance.
