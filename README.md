# AI Usage Guardian 🛡️

AI Usage Guardian is a free, privacy-first SaaS platform and Chrome Extension designed to help users track, budget, and optimize token and message consumption across multiple AI chat interfaces (**ChatGPT, Claude, Gemini, Grok, Perplexity**, and more) without any paid API dependencies.

The system calculates usage metrics locally using statistical heuristic token approximations and client-side message scrapers, injecting a premium glassmorphic "Usage summary" widget directly into the interfaces.

---

## 🌟 Vision & Key Benefits
- **Zero-Cost Operation:** No paid LLM APIs required; token and burn calculations occur client-side or on lightweight local Python engines.
- **Cross-Platform Widget:** Embeds a beautiful "Usage summary" widget (mirroring the Claude-style panel layout) directly into ChatGPT, Claude, Gemini, and other portals.
- **Budget Alerts:** Generates desktop notifications when user consumes 50%, 75%, 90%, and 100% of their daily token limit.
- **Prompt Efficiency Engine:** Analyzes thread depth, average query length, repetitions, and intervals to rate prompt quality from 0-100.
- **Burn Rate Engine:** Visualizes consumption velocity (tokens per hour) and predicts remaining hours before budget exhaustion.

---

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TypeScript, TailwindCSS, Zustand (State), Recharts (Visuals)
- **Chrome Extension:** Manifest V3, Content scripts (observer and scraper), Background worker, CSS-inject widget, popup panels
- **Backend:** FastAPI, Pydantic, SQLAlchemy
- **Database:** PostgreSQL (compatible with Supabase Free Tier)

---

## 📂 Repository Structure
```
limiter/
├── extension/             # Chrome Extension (Manifest V3)
│   ├── src/
│   │   ├── content/       # Page scraping, observers, widget injectors
│   │   ├── background/    # Budgets, notification checking, local storage cache
│   │   ├── popup/         # Small utility page for configuring storage credentials & limits
│   │   ├── storage/       # Wrappers for chrome.storage.local
│   │   └── utils/         # Local client-side token counting logic
│   ├── manifest.json
│   └── package.json
│
├── backend/               # FastAPI Web Server
│   ├── app/
│   │   ├── api/           # Auth validation, message syncs, analytics
│   │   ├── database/      # SQL connection and sessions pool
│   │   ├── models.py      # SQLAlchemy PostgreSQL schemas
│   │   ├── schemas.py     # Pydantic schemas
│   │   └── main.py        # Server setup, middleware, routers
│   └── requirements.txt
│
└── frontend/              # SaaS Analytics Web Dashboard
    ├── src/
    │   ├── components/    # Grid stats, Recharts timelines, settings sliders
    │   ├── store/         # Zustand data slices
    │   └── App.tsx        # Dashboard routing and layout
    └── package.json
```

---

## 🚀 Getting Started

### 1. Database Provisioning
Configure your Supabase PostgreSQL instance and copy the Connection String.
Create a `.env` file inside the `backend/` directory:
```env
DATABASE_URL=postgresql://postgres:<your-password>@db.<your-project-ref>.supabase.co:5432/postgres
SECRET_KEY=generate_a_secure_long_secret_key_here
```

### 2. Backend Server
Navigate to the `backend/` directory, create a virtual environment, install requirements, and run the server:
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend API is now running on `http://localhost:8000`.

### 3. Chrome Extension
Deploy the extension in Chrome:
1. Navigate to the `extension/` folder and install dependencies:
   ```bash
   cd extension
   npm install
   npm run build
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `extension/dist/` directory generated during the build.
5. Pin the extension. Click on the popup to register/login your account.

### 4. SaaS Frontend Dashboard
Run the dashboard interface:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the dark-mode Stripe-style Vercel dashboard showing your synchronized AI metrics.

---

## 📊 Database Schema
```sql
-- Profiles table linked to Supabase Auth users
CREATE TABLE profiles (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Budgets table for daily token limits
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    platform VARCHAR NOT NULL,
    daily_token_limit INTEGER DEFAULT 100000,
    daily_message_limit INTEGER DEFAULT 100,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Conversations table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    external_conv_id VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    title VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, external_conv_id, platform)
);
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for details.
