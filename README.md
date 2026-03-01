# UNSAID - Authentication System (Week 1)

A production-ready authentication system built with Next.js, Express, PostgreSQL, and Prisma.

## 📁 Project Structure

```
Unsaid/
├── server/                    # Express Backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validate.middleware.ts
│   │   ├── routes/            # API routes
│   │   │   ├── auth.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── utils/             # Utility functions
│   │   │   ├── appError.ts
│   │   │   ├── jwt.utils.ts
│   │   │   ├── password.utils.ts
│   │   │   ├── prisma.ts
│   │   │   └── validation.ts
│   │   └── index.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── client/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── auth/          # Auth components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── PinLockScreen.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── providers/     # Context providers
│   │   │   └── ui/            # Reusable UI components
│   │   ├── lib/               # Utilities
│   │   │   ├── api.ts         # Axios client
│   │   │   ├── utils.ts
│   │   │   └── validations.ts
│   │   └── stores/            # Zustand stores
│   │       ├── authStore.ts
│   │       └── pinLockStore.ts
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup

```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Create database
createdb unsaid
```

### 2. Server Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database URL and secrets

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### 3. Client Setup

```bash
cd client

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

---

## 🔐 Security Implementation

### Password Security

```typescript
// BCrypt hashing with 12 salt rounds (12 = ~250ms per hash)
const SALT_ROUNDS = 12;
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Password requirements:
// - Minimum 8 characters
// - At least 1 uppercase letter
// - At least 1 lowercase letter
// - At least 1 number
// - At least 1 special character
```

### JWT Token Strategy

| Token Type | Storage | Expiry | Purpose |
|------------|---------|--------|---------|
| Access Token | httpOnly Cookie | 15 minutes | API authentication |
| Refresh Token | httpOnly Cookie + Database | 7 days | Token renewal |

**Why httpOnly Cookies?**
- Cannot be accessed by JavaScript (XSS immune)
- Automatically sent with requests
- Works seamlessly with CORS

```typescript
// Cookie configuration
const accessTokenCookieOptions = {
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // HTTPS only (production)
  sameSite: 'lax',     // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes
};
```

### Token Refresh Flow

```
1. Access token expires (401 response)
2. Client automatically calls /api/auth/refresh
3. Server validates refresh token
4. Old refresh token is revoked (rotation)
5. New tokens are issued
6. Original request is retried
```

### Account Lockout Protection

```typescript
// After 5 failed login attempts:
// - Account is locked for 15 minutes
// - User receives lockout message
// - Counter resets on successful login
```

---

## 📡 API Endpoints

### Authentication Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/logout` | ❌ | Logout current session |
| POST | `/api/auth/logout-all` | ✅ | Logout all devices |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| GET | `/api/auth/me` | ✅ | Get current user |

### User Routes (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PATCH | `/api/users/profile` | Update profile |
| POST | `/api/users/change-password` | Change password |
| GET | `/api/users/sessions` | List active sessions |
| DELETE | `/api/users/sessions/:id` | Revoke session |

### Request/Response Examples

**Signup:**
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 🛡️ Security Best Practices

### 1. Environment Variables

```bash
# Generate secure secrets
openssl rand -base64 64

# Never commit .env files
# Use different secrets for each environment
```

### 2. CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.CLIENT_URL,  // Whitelist your frontend
  credentials: true,                // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
};
```

### 3. Rate Limiting

```typescript
// General API: 100 requests per 15 minutes
// Auth routes: 10 requests per 15 minutes (stricter)
```

### 4. Input Validation

- All inputs validated with Zod schemas
- SQL injection prevented by Prisma ORM
- XSS prevented by proper encoding

### 5. Headers Security (Helmet)

```typescript
// Enabled security headers:
// - Content-Security-Policy
// - X-DNS-Prefetch-Control
// - X-Frame-Options
// - X-Content-Type-Options
// - Referrer-Policy
// - X-Permitted-Cross-Domain-Policies
```

---

## ⏱️ Auto-Logout & PIN Lock

### Auto-Logout (Backend + Frontend)

```typescript
// Frontend: Tracks user activity
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Activity events monitored:
// - mousedown, mousemove, keydown
// - scroll, touchstart, click

// On timeout: Calls logout API, clears tokens
```

### PIN Lock (Frontend Only)

```typescript
// Features:
// - 4-digit PIN entry
// - Locks after 1 minute of inactivity
// - Locks when browser tab loses focus
// - 5 failed attempts = 5 minute lockout
// - Does NOT affect backend authentication
```

**PIN Lock Flow:**
```
1. User enables PIN in dashboard
2. After inactivity → Lock screen appears
3. User enters PIN → App unlocks
4. Backend session remains valid throughout
```

---

## 🔄 Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name description_of_change

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

---

## 🔧 Configuration Reference

### Server Environment (.env)

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/unsaid"

# JWT (use strong random values!)
JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="another-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
CLIENT_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Client Environment (.env.local)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Timeouts
NEXT_PUBLIC_INACTIVITY_TIMEOUT=300000
NEXT_PUBLIC_PIN_LOCK_TIMEOUT=60000
```

---

## 📱 Mobile App Support

The API is designed for easy mobile integration:

1. **Token Storage**: For mobile apps, store tokens in secure storage (Keychain/Keystore)
2. **Authorization Header**: Send token as `Bearer` in `Authorization` header
3. **Refresh Logic**: Same refresh flow works for mobile

```typescript
// Mobile client example
const api = axios.create({
  baseURL: 'https://api.unsaid.com',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

---

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:5000/api/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get profile (with cookie)
curl http://localhost:5000/api/auth/me \
  -b cookies.txt
```

---

## 🚨 Troubleshooting

### "CORS error"
- Ensure `CLIENT_URL` in server `.env` matches frontend URL
- Check `credentials: true` in CORS config

### "Token expired" constantly
- Check system clock synchronization
- Verify `JWT_EXPIRES_IN` is set correctly

### "Cannot connect to database"
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Run `npx prisma db push` to sync schema

### "Prisma client not found"
- Run `npm run prisma:generate` in server directory

---

## 📝 Next Steps (Week 2+)

- [ ] Email verification
- [ ] Password reset flow
- [ ] OAuth (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Session management UI
- [ ] Activity logging
- [ ] Account deletion

---

## 📄 License

MIT License - feel free to use this code for your projects.
