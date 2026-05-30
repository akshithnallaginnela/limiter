# Installation Guide - AI Usage Guardian 🛡️

Follow these step-by-step instructions to get **AI Usage Guardian** running locally on your machine.

---

## Prerequisites
Ensure you have the following installed:
1. **Node.js** (v18.0.0 or higher) & **npm** (v9.0.0 or higher)
2. **Python** (v3.10 or higher) & **pip**
3. **Google Chrome** (or any Chromium-based browser like Brave, Edge, Opera)
4. A **Supabase** account (Free tier is perfectly fine)

---

## Step 1: Database Setup (Supabase)
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Once the project is provisioned, go to **Project Settings** -> **Database**.
3. Copy the **URI Connection String** under "Connection string" (select the transaction pooler if available, or direct connection).
4. Go to **SQL Editor** in Supabase dashboard and run the SQL script to provision the tables:
   ```sql
   CREATE TABLE public.profiles (
       id VARCHAR PRIMARY KEY,
       email VARCHAR UNIQUE NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   CREATE TABLE public.budgets (
       id SERIAL PRIMARY KEY,
       user_id VARCHAR REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
       platform VARCHAR NOT NULL,
       daily_token_limit INTEGER NOT NULL DEFAULT 100000,
       daily_message_limit INTEGER DEFAULT 100,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
       UNIQUE(user_id, platform)
   );

   CREATE TABLE public.conversations (
       id SERIAL PRIMARY KEY,
       user_id VARCHAR REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
       external_conv_id VARCHAR NOT NULL,
       platform VARCHAR NOT NULL,
       title VARCHAR,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
       UNIQUE(user_id, external_conv_id, platform)
   );

   CREATE TABLE public.messages (
       id SERIAL PRIMARY KEY,
       conversation_id INTEGER REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
       role VARCHAR NOT NULL,
       content_length INTEGER NOT NULL,
       estimated_tokens INTEGER NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   CREATE TABLE public.usage_analytics (
       id SERIAL PRIMARY KEY,
       user_id VARCHAR REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
       date DATE NOT NULL,
       platform VARCHAR NOT NULL,
       tokens_input INTEGER NOT NULL DEFAULT 0,
       tokens_output INTEGER NOT NULL DEFAULT 0,
       message_count INTEGER NOT NULL DEFAULT 0,
       conversation_count INTEGER NOT NULL DEFAULT 0,
       UNIQUE(user_id, date, platform)
   );

   CREATE TABLE public.user_settings (
       id SERIAL PRIMARY KEY,
       user_id VARCHAR REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
       sync_enabled INTEGER DEFAULT 1 NOT NULL,
       alert_thresholds VARCHAR DEFAULT '50,75,90,100' NOT NULL,
       notifications_enabled INTEGER DEFAULT 1 NOT NULL,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
   );
   ```

---

## Step 2: Backend Setup (FastAPI)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows (PowerShell):** `.\venv\Scripts\activate`
   - **macOS/Linux:** `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file in the root of the `backend/` folder:
   ```env
   DATABASE_URL=your_supabase_postgresql_connection_string
   SECRET_KEY=generate_a_secure_long_secret_key_here
   ```
6. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API documentation should be available at `http://localhost:8000/docs`.

---

## Step 3: Compile Chrome Extension
1. Open a new terminal and navigate to the extension directory:
   ```bash
   cd extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the typescript code:
   ```bash
   npm run build
   ```
   This will generate a `dist/` directory containing `manifest.json`, compiled javascript files, styles, and asset files.

4. Load the extension in Google Chrome:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer Mode** using the toggle in the top-right corner.
   - Click the **Load unpacked** button in the top-left.
   - Select the `extension/dist/` directory from the file browser.
   - Pin the "AI Usage Guardian" extension to your browser toolbar.

---

## Step 4: Run SaaS Dashboard
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the dashboard by opening `http://localhost:3000` in your web browser. Login or register using your email and password to bind your sync session.

---

## Step 5: Verify the End-to-End Flow
1. Open **Claude** (`https://claude.ai/`) or **ChatGPT** (`https://chatgpt.com/`).
2. Verify that the **Usage summary** widget renders in the bottom-right corner of the page.
3. Open the Chrome Extension popup window by clicking the toolbar icon, navigate to **Sync**, and log in using the same email you plan to use on the SaaS dashboard.
4. Send a prompt on Claude or ChatGPT.
5. Verify that the "Messages" count and "Estimated Used" progress bars advance.
6. Open the SaaS Dashboard at `http://localhost:3000`. You should see identical numbers and platform charts matching your activity.
