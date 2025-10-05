🎬 WatchWise
Your Personal Movie Tracker & Social Review Platform








🌟 Overview

WatchWise is a full-stack web app that helps users track, review, and discover movies.
It features user authentication, personal watchlists, ratings, reviews, and a social feed where users can interact through comments and emoji reactions.

Built for movie fans who want one simple place to organize what they watch and connect with others.

🚀 Features

🎥 Movie Tracking — Add movies to your watchlist or mark them as completed.

⭐ Ratings & Reviews — Rate movies out of 10 and share your opinions.

💬 Social Feed — View, comment, and react to other users’ reviews.

❤️ Emoji Reactions — Express how you feel about a review with one click.

🔍 Search & Filters — Search movies by title or keywords, and filter results by genre.

👤 User Profiles — Customize your username and profile avatar.

📚 Library Tabs — Easily view your watchlist or completed movies.

🌗 Light/Dark Mode — Switch themes for comfortable viewing.

🔐 Authentication — Secure email-based login via Supabase Auth.

🛠️ Tech Stack
Layer	Technology
Frontend	Next.js 15 (App Router), React, Tailwind CSS
Backend	Supabase (PostgreSQL, Auth, Storage)
API	TMDB (The Movie Database)
Auth	Supabase Magic Link / Email Auth
Hosting	Vercel + Supabase Cloud
Language	TypeScript
🧩 Database Schema (Simplified)

Tables:

profiles — User info, avatar, username

items — Movie metadata (title, TMDB ID, poster, genre)

user_items — Links users to movies (watchlist, completed, ratings, reviews)

reactions — Emoji reactions on reviews

comments — User comments on reviews

🧑‍💻 Local Development Setup

1️⃣ Clone the Repository
git clone https://github.com/<your-username>/watchwise.git
cd watchwise

2️⃣ Install Dependencies
npm install

3️⃣ Configure Environment Variables

Create a .env.local file in your project root:

NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
NEXT_PUBLIC_TMDB_API_KEY=<your-tmdb-api-key>

4️⃣ Run the Dev Server
npm run dev


Then open http://localhost:3000

🧱 Project Structure
src/
├── app/
│   ├── page.tsx              # Home Page (Recommendations)
│   ├── feed/page.tsx         # Social Feed
│   ├── library/page.tsx      # Watchlist & Completed Tabs
│   ├── profile/page.tsx      # User Profile & Settings
│   ├── search/page.tsx       # Search Page with Filters
│   └── api/                  # API Routes (Supabase + TMDB)
├── components/
│   ├── ItemCard.tsx
│   ├── AuthButton.tsx
│   ├── ThemeToggle.tsx
│   └── NavBar.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── styles/
    └── globals.css

🧭 Future Improvements

👥 Follow / Friend system

🗓️ “Currently Watching” category

🎞️ Support for TV shows and anime

📈 Activity statistics (ratings history, most-watched genres)

🧩 Optional AI-powered recommendations (future-ready, free-tier friendly)

🏗️ Deployment

Deployed easily with Vercel — connect your GitHub repo and add your Supabase + TMDB API keys as environment variables in the dashboard.

⚖️ License

This project is licensed under the MIT License
.

💬 Acknowledgements

Supabase
 — Auth, DB, and Storage

TMDB
 — Movie Data API

Next.js
 — Full-stack React Framework

Tailwind CSS
 — Styling Framework

⭐ Support

If you like WatchWise, please consider giving it a ⭐ on GitHub to support continued development!
