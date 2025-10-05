# 🎬 WatchWise  
### _Your AI-Powered Movie Tracker & Social Review Platform_

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-blue?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 🌟 Overview

**WatchWise** is a full-stack web app that lets users track what they watch, discover new films, and connect with other movie lovers.  
It uses **AI-powered recommendations**, **Supabase authentication**, and a sleek **Next.js + Tailwind** interface to make your watchlist more intelligent and social.  

> Built for cinephiles who love discovering, rating, and discussing movies — all in one place.

---

## 🚀 Features

- 🎥 **Smart Movie Recommendations** — AI-powered suggestions based on your favorites, ratings, and reviews.  
- ⭐ **Personal Library** — Track watchlist and completed movies, leave ratings, and write detailed reviews.  
- 💬 **Social Feed** — Discover other users’ reviews, comment, and react with emojis.  
- 🧠 **AI-Driven Suggestions** — Recommends trending titles if user data is limited.  
- 🔍 **Advanced Search & Filters** — Search movies by title, genre, or keywords with intelligent filters.  
- 👤 **Profile Customization** — Update your username, upload an avatar, and manage account settings.  
- 🌗 **Light/Dark Mode** — Seamless theme toggle for better viewing comfort.  
- 🔐 **Secure Authentication** — Email-based sign-in powered by Supabase Auth.  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js 15 (App Router), React, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **API** | TMDB (The Movie Database) |
| **Auth** | Supabase Magic Link / Email Auth |
| **Hosting** | Vercel + Supabase Cloud |
| **Language** | TypeScript |

---

## 🧩 Database Schema (Simplified)

**Tables:**
- `profiles` — user info, avatar, username  
- `items` — movie metadata (title, TMDB ID, poster, etc.)  
- `user_items` — connects users to movies (watchlist, completed, reviews, ratings, favorites)  
- `reactions` — emoji reactions to reviews  
- `comments` — user comments on reviews  

---

## 🧑‍💻 Local Development Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/watchwise.git
cd watchwise
