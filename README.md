# Dokaa — MVP ya Kuunganisha Customers na Service Providers (Dar es Salaam)

App ya kuunganisha wateja na mafundi (Umeme, Plumbing, Cleaning, Mechanic, Appliance Repair).

## Muundo wa Project
```
dokaa-app/
  backend/     -> Node.js + Express + PostgreSQL API
  frontend/    -> React Native + Expo mobile app
```

## Mpangilio wa Kuanza (Termux)

**Fuata hatua kwa mpangilio huu:**

1. Soma `backend/README.md` — sakinisha PostgreSQL, weka schema, anzisha API server
2. Soma `frontend/README.md` — sakinisha Expo, badilisha BASE_URL, anzisha app

Backend LAZIMA iendeshwe kwanza kabla ya kufungua frontend, kwa sababu app inahitaji ku-connect na API kwa register/login.

## Kilichojumuishwa kwenye Toleo hili (Phase 1 MVP)

**Backend:**
- Auth (register/login) na JWT, roles: customer / provider / admin
- Database schema kamili (users, providers, categories, services, bookings, reviews, payments, n.k.)
- Endpoints za categories, services, providers (na location-based filtering kwa Haversine formula), bookings, reviews

**Frontend:**
- Login na Register screens (Kiswahili)
- Password strength indicator yenye animation (kama ile uliyoonyesha kwenye screenshot — "bank vault" style)
- Auth flow kamili (JWT stored kwenye AsyncStorage)
- Home screen inayoonyesha categories kutoka backend

## Hatua Zinazofuata (Baada ya MVP hii kufanya kazi)
- Provider list + profile screens (customer anaona providers karibu)
- Booking flow kamili
- Chat kati ya customer na provider
- Admin dashboard (approve/block providers)
- M-Pesa payment integration
- Firebase push notifications
- Cloudinary image upload

Rejea mazungumzo yetu ya awali kwa muhtasari kamili wa roadmap (Phase 1, 2, 3).
