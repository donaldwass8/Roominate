# Roominate - Smart Study Room Booking Platform

Welcome to the frontend application for Roominate! This is a modern, responsive React application built with Vite and properly integrated with our Supabase database backend.

## Prerequisites

The dependencies are cleanly tracked in the `package.json` file. 

You only need **Node.js** installed on your system to run it.
- Download Node.js from [nodejs.org](https://nodejs.org/en/download/) (LTS version recommended).

## Setup & Running Locally

1. **Clone the repository** and open a terminal inside the project root layer.

2. **Navigate into the frontend folder**:
   ```bash
   cd frontend
   ```

3. **Install the dependencies**:
  run:
   ```bash
   npm install
   ```

4. **Set up Environment Variables**:
   You must create a file called `.env` directly inside the `frontend/` folder matching this exact structure:
   ```env
   VITE_SUPABASE_URL=https://hkplugddvmhsuovxgdgz.supabase.co
   VITE_SUPABASE_ANON_KEY=your_team_secret_anon_key_here
   ```
   just replace the 'your_team_secret_anon_key_here' with the supabase public anon key.

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

6. The application will start running on `http://localhost:5173`. Open this URL in your browser to view the application!


