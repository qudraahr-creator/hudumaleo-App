# Dokaa Backend (MVP)

Node.js + Express + PostgreSQL API kwa app ya kuunganisha customers na service providers (Umeme, Plumbing, Cleaning, Mechanic, Appliance Repair) — Dar es Salaam.

## Kuendesha kwenye Termux

### 1. Sakinisha vitu vya msingi
```bash
pkg update && pkg upgrade
pkg install nodejs postgresql git
```

### 2. Anzisha PostgreSQL
```bash
initdb $PREFIX/var/lib/postgresql
pg_ctl -D $PREFIX/var/lib/postgresql start
createdb dokaa_db
```

### 3. Weka schema
```bash
psql dokaa_db -f db/schema.sql
```

### 4. Sakinisha dependencies za backend
```bash
cd backend
npm install
```

### 5. Weka environment variables
```bash
cp .env.example .env
# Fungua .env na weka DATABASE_URL yako sahihi, mfano:
# DATABASE_URL=postgresql://localhost:5432/dokaa_db
# JWT_SECRET=badilisha_hii
```

### 6. Anzisha server
```bash
npm start
# au kwa auto-reload wakati wa development:
npm run dev
```

Server itaanza kwenye `http://localhost:5000`

## Kujaribu API (kwa curl au Postman)

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Juma Ally","phone":"0712345678","password":"password123","role":"customer"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0712345678","password":"password123"}'
```

**Angalia categories:**
```bash
curl http://localhost:5000/api/categories
```

## Muundo wa Folder
```
backend/
  config/db.js          -> PostgreSQL connection
  controllers/           -> Business logic
  routes/                -> API endpoints
  middleware/auth.js     -> JWT verification
  db/schema.sql          -> Database tables + seed data
  server.js              -> Entry point
```

## Endpoints Muhimu

| Method | Endpoint | Maelezo |
|--------|----------|---------|
| POST | /api/auth/register | Sajili customer au provider |
| POST | /api/auth/login | Ingia |
| GET  | /api/auth/me | Taarifa za user aliye-login |
| GET  | /api/categories | Orodha ya categories |
| GET  | /api/services?category_id=1 | Services za category husika |
| GET  | /api/providers?category_id=1&lat=..&lng=.. | Tafuta providers karibu |
| GET  | /api/providers/:id | Profile ya provider |
| POST | /api/providers/me/services | Provider anaongeza huduma anazotoa |
| POST | /api/providers/me/location | Provider anaweka eneo lake |
| POST | /api/bookings | Customer anaweka booking |
| GET  | /api/bookings/mine | Bookings za mtumiaji aliye-login |
| PATCH | /api/bookings/:id/status | Badilisha status ya booking |
| POST | /api/reviews | Customer anaacha review |

## Hatua Zinazofuata (Sio Sehemu ya MVP hii)
- Chat/messages endpoints (jedwali la `messages` liko tayari kwenye schema)
- Payments integration (M-Pesa)
- Push notifications (Firebase)
- Admin dashboard endpoints (approve/block providers)
- Image upload (Cloudinary) kwa verification documents
