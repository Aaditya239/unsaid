# 🧠 UNSAID - AI-Powered Mental Wellness Platform

**An all-in-one mental health companion** that combines mood tracking, AI emotional support, journaling, meditation, music therapy, and task management—all in one beautiful, secure platform.

**Status:** Built in 17 days (Feb 13 - Mar 2, 2026)  
**Stack:** Next.js 14 • Express.js • PostgreSQL • Prisma • GROQ AI • TypeScript

---

## ✨ Key Features

### 🎯 Core Wellness Features
- **Mood Tracking** - Log emotions with detailed analytics and emotional growth insights
- **AI Emotional Companion** - Real-time conversations with GROQ-powered AI support
- **Smart Journaling** - Write, reflect, and get AI-powered journal insights
- **Calm & Meditation** - Guided breathing exercises and mindfulness exercises
- **Focus Music** - Curated YouTube playlists for focus, energy, calm, emotional support, and night
- **Emotion-Aware Tasks** - Tasks that adapt based on your emotional state
- **Push Notifications** - Stay motivated with timely wellness reminders

### 🔒 Security & Privacy
- **Enterprise-grade Authentication** - JWT with token refresh, auto-logout, PIN lock
- **Password Security** - BCrypt hashing with 12 salt rounds
- **Session Management** - Multi-device support with session revocation
- **Account Lockout** - Protection against brute-force attacks (5 failed attempts = 15 min lockout)
- **httpOnly Cookies** - XSS protection, CSRF protection

### 💾 Data & State Management
- **Complex Database Schema** - 15+ Prisma models tracking mood, journals, conversations, tasks, notifications
- **Real-time Sync** - Zustand stores for optimistic updates
- **Offline Support** - Service Worker integration for offline access

---

## 📁 Project Structure

```
Unsaid/
├── server/                         # Express.js Backend
│   ├── prisma/
│   │   ├── schema.prisma          # 15+ models (User, Mood, Journal, AI Conversations, etc.)
│   │   └── migrations/            # Database version control
│   ├── src/
│   │   ├── controllers/           # Request handlers (auth, mood, journal, ai, tasks, etc.)
│   │   ├── middleware/            # Auth, error handling, validation
│   │   ├── routes/                # API endpoints
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # JWT, passwords, validation, error handling
│   │   └── index.ts               # Server entry point
│
├── client/                         # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/                   # Page Router
│   │   │   ├── auth/              # Login, signup, PIN lock
│   │   │   ├── dashboard/         # Home page, analytics
│   │   │   ├── mood/              # Mood tracking & history
│   │   │   ├── journal/           # Journaling interface
│   │   │   ├── calm/              # Meditation & breathing
│   │   │   ├── ai-support/        # AI companion chat
│   │   │   ├── tasks/             # Task management
│   │   │   ├── notifications/     # Notification center
│   │   │   ├── profile/           # User profile & settings
│   │   │   └── settings/          # App settings
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/                 # Custom hooks (useAudioPlayer, useTimer, useTheme)
│   │   ├── stores/                # Zustand state stores
│   │   ├── lib/                   # API client, utilities
│   │   ├── config/                # XP rules, constants
│   │   └── data/                  # Music playlists, static data
│   └── public/                    # Static assets, service worker
│
└── docs/                          # Documentation
    ├── DEPLOYMENT.md              # Vercel + Render setup
    └── YOUTUBE_API_SETUP.md       # YouTube API configuration
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** or **yarn**
- **YouTube API Key** (for music playlists)
- **GROQ API Key** (for AI companion)

### 1️⃣ Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/Unsaid.git
cd Unsaid

# Install dependencies (root, server, and client)
npm run install:all
```

### 2️⃣ Database Setup

```bash
# Start PostgreSQL (macOS)
brew services start postgresql

# Create database
createdb unsaid

# Navigate to server and set up database
cd server
npm run prisma:generate
npm run prisma:migrate

cd ..
```

### 3️⃣ Environment Variables

**Server** (`server/.env`):
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/unsaid"

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_SECRET="your-super-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
CLIENT_URL="http://localhost:3000"

# APIs
GROQ_API_KEY="your-groq-api-key"
YOUTUBE_API_KEY="your-youtube-api-key"

# Push Notifications
VAPID_PUBLIC_KEY="your-vapid-public"
VAPID_PRIVATE_KEY="your-vapid-private"
```

**Client** (`client/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=UNSAID
NEXT_PUBLIC_INACTIVITY_TIMEOUT=300000
NEXT_PUBLIC_PIN_LOCK_TIMEOUT=60000
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public"
```

### 4️⃣ Run Development Servers

```bash
# From root directory - runs both servers concurrently
npm run dev

# OR separately:
npm run dev:server    # Terminal 1
npm run dev:client    # Terminal 2
```

### 5️⃣ Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health
- **Prisma Studio:** `cd server && npm run prisma:studio`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| **Backend** | Express.js, Node.js, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **AI** | GROQ API (real-time inference) |
| **APIs** | YouTube Data API, Web Push API |
| **Auth** | JWT, bcrypt, httpOnly cookies |
| **State** | Zustand (client), Context API |
| **Deployment** | Vercel (frontend), Render (backend) |

---

## 🎨 Key Implementation Highlights

### 🤖 AI Integration
- Real-time conversations with GROQ LLaMA 2
- Emotion-aware responses
- Session-based conversation history
- Streaming responses for better UX

### 📊 Mood Tracking
- Daily mood logging with intensity tracking
- Emotional growth analytics
- Trend visualization
- Personalized insights

### 🎵 Music Therapy
- YouTube API integration for curated playlists
- 5 playlist categories (Calm, Emotional, Energy, Focus, Night)
- Integrated audio player with favorites
- Offline music support via service worker

### 📝 AI-Powered Journaling
- Rich text journaling interface
- Auto-save functionality
- AI-generated reflection prompts
- Emotion tagging and search

### ⚡ Performance & UX
- Optimistic updates with Zustand
- Server-side rendering with Next.js
- Image optimization
- Responsive design (mobile-first)

---

## 🔐 Security Architecture

### Authentication Flow
1. User signs up with email & password
2. Password hashed with bcrypt (12 salt rounds)
3. Access token (15 min) + Refresh token (7 days) issued
4. Tokens stored in httpOnly cookies
5. Auto-logout after 5 minutes of inactivity
6. Optional PIN lock for additional security

### Security Features Implemented
```typescript
✅ httpOnly Cookies         // XSS protection
✅ CSRF Token Rotation      // CSRF protection
✅ Account Lockout          // Brute-force protection (5 attempts)
✅ Rate Limiting            // 100 req/15min for general, 10 req/15m for auth
✅ Input Validation         // Zod schema validation
✅ SQL Injection Prevention  // Prisma ORM parameterized queries
✅ Helmet Security Headers  // CSP, X-Frame-Options, etc.
✅ Password Requirements    // Min 8 chars, uppercase, lowercase, number, special
✅ Session Management       // Multi-device support with revocation
✅ JWT Refresh Rotation     // Old tokens auto-revoked on refresh
```

### PIN Lock System
- Optional 4-digit PIN
- Activates after 1 minute of inactivity
- Locks when tab loses focus
- 5 failed attempts = 5 minute lockout
- Does NOT affect backend session validity

### Token Strategy

| Token | Storage | Duration | Rotation |
|-------|---------|----------|----------|
| Access | httpOnly Cookie + DB | 15 minutes | Used for API calls |
| Refresh | httpOnly Cookie + DB | 7 days | Rotated on each use |

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/logout` | ❌ | Logout current session |
| POST | `/api/auth/logout-all` | ✅ | Logout all devices |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| GET | `/api/auth/me` | ✅ | Get current user |

### Wellness Endpoints

| Feature | Endpoints |
|---------|-----------|
| **Mood** | POST `/api/mood`, GET `/api/mood`, GET `/api/mood/analytics` |
| **Journal** | POST `/api/journal`, GET `/api/journal`, GET `/api/journal/:id` |
| **AI Chat** | POST `/api/ai/chat`, GET `/api/ai/conversations` |
| **Tasks** | POST `/api/tasks`, GET `/api/tasks`, PATCH `/api/tasks/:id` |
| **Music** | GET `/api/music/playlists`, POST `/api/music/favorites` |
| **Notifications** | GET `/api/notifications`, PATCH `/api/notifications/:id` |

### Example: Mood Tracking

```bash
# Log a mood entry
curl -X POST http://localhost:5000/api/mood \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "emotion": "anxious",
    "intensity": 7,
    "notes": "Got bad feedback at work",
    "triggers": ["work", "stress"]
  }'

# Get mood analytics
curl http://localhost:5000/api/mood/analytics \
  -b cookies.txt
```

### Example: AI Chat

```bash
# Send message to AI companion
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "message": "I am feeling overwhelmed",
    "conversationId": "optional-id"
  }'
```

---

## 🛡️ Best Practices & Architecture Decisions

### Why httpOnly Cookies?
- ✅ XSS Immune: JavaScript cannot access them
- ✅ Auto-sent: No manual Authorization header needed  
- ✅ CSRF Protection: With sameSite attribute
- ✅ Mobile Ready: Works with Bearer tokens on request headers too

### Database Design
- **15+ Prisma Models**: User, Mood, Journal, AIConversation, Task, Notification, etc.
- **Normalized Schema**: Prevents data duplication
- **Soft Deletes**: Using `deletedAt` field for data recovery
- **Indexes**: On frequently queried fields for performance
- **Migrations**: Version-controlled schema changes

### State Management
- **Zustand**: Client-side stores for auth, mood, journal, AI, music, settings
- **Optimistic Updates**: Fast user feedback
- **Persistence**: LocalStorage sync for offline capability

### Error Handling
- **Custom Error Class**: `AppError` with status codes and messages
- **Global Error Middleware**: Centralized error handling
- **Client-side Error Boundaries**: Graceful degradation

---

## 🧪 Testing & Deployment

### Local Testing

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Test protected endpoint
curl http://localhost:5000/api/auth/me -b cookies.txt
```

### Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for:
- ✅ Vercel frontend deployment
- ✅ Render backend + PostgreSQL setup
- ✅ Environment variables configuration
- ✅ YouTube API setup
- ✅ GROQ API integration

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| **CORS error** | Ensure `CLIENT_URL` in `.env` matches frontend URL |
| **Token expired constantly** | Check system clock sync, verify `JWT_EXPIRES_IN` |
| **Cannot connect to database** | Run `brew services start postgresql`, verify `DATABASE_URL` |
| **Prisma client not found** | Run `npm run prisma:generate` in server directory |
| **GROQ API errors** | Verify `GROQ_API_KEY` is valid and has quota |
| **YouTube playlists not loading** | Check `YOUTUBE_API_KEY` has YouTube Data API v3 enabled |
| **PIN lock not working** | Clear browser cookies, refresh page |
| **Service worker errors** | Clear browser cache, reload in incognito mode |

---

## 📊 Database Schema Overview

**Key Models:**
- **User** - Email, password hash, profile info, preferences
- **Mood** - Emotion, intensity, triggers, timestamps
- **Journal** - Content, emotion tags, AI reflections
- **AIConversation** - Messages, session tracking, emotional context
- **Task** - Title, emotion-aware priority, completion status
- **Notification** - Type, status, user subscription
- **MusicFavorite** - Bookmarked playlists
- **UserStreak** - Daily engagement tracking
- **EmotionalGrowth** - Growth tracking & statistics

---

## 📈 Features Built in 17 Days

- [x] Complete auth system (signup, login, token refresh, logout)
- [x] PIN lock mechanism
- [x] Auto-logout on inactivity
- [x] Mood tracking and analytics
- [x] Journaling with AI integration
- [x] AI emotional companion
- [x] Music therapy with YouTube API
- [x] Task management with emotion awareness
- [x] Push notifications
- [x] Service worker for offline support
- [x] Responsive mobile design
- [x] Dark/light theme support
- [x] Security hardening (rate limiting, input validation, helmet)
- [x] Database migrations
- [x] Deployment configs

---

## 🔮 Future Enhancements

- [ ] Email verification & password reset
- [ ] OAuth (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Advanced mood analytics with charts
- [ ] Guided breathing exercises with videos
- [ ] Social features (share journals, group meditation)
- [ ] Habit tracking
- [ ] Therapist notes (for professional use)
- [ ] Mobile app (React Native)
- [ ] Voice journaling
- [ ] Real-time multiplayer meditation sessions

---

## 📚 Learning Resources Used

- Next.js 14 App Router documentation
- Prisma ORM best practices
- JWT authentication patterns
- GROQ API integration
- YouTube Data API v3
- Web Push API
- TypeScript advanced patterns

---

## 🤝 Contributing

This is a personal project, but feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📄 License

MIT License - Feel free to use this code for personal or commercial projects.

**Built with ❤️ for mental wellness**
