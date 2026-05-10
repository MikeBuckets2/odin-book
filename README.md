# Orbit — Social Media Platform

A full-stack social media application built with React, Express, and PostgreSQL. Users can create accounts, follow each other, post content, like and comment on posts.

**Stack:** React + Vite | Express + Passport.js + JWT | PostgreSQL | Prisma

---

## 📁 Project Structure

```
orbit/
├── backend/                  # Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database models
│   │   └── seed.js           # Fake data seeder
│   └── src/
│       ├── config/
│       │   ├── passport.js   # Passport-local strategy
│       │   └── prismaClient.js  # Shared Prisma + pg adapter instance
│       ├── controllers/      # Route handlers
│       ├── middleware/
│       │   └── authMiddleware.js  # JWT guard
│       ├── routes/           # Express routers
│       └── app.js            # Entry point
└── frontend/                 # React + Vite SPA
    └── src/
        ├── api/
        │   └── apiClient.js  # Axios instance + all API calls
        ├── components/       # Reusable UI components
        ├── context/
        │   └── AuthContext.jsx  # Global auth state
        └── pages/            # Route-level page components
```

---

## Features

- JWT authentication
- Passport.js local strategy for credential verification
- Follow / unfollow system with pending request approval
- Post feed showing own posts + accepted follows
- Optimistic like toggling
- Comment add/delete with author permissions
- Profile editing (username, bio, avatar URL)
- Guest account for demos
- DiceBear auto-generated avatars (no upload required)
- Image posts via URL
- Seeded fake data with Faker.js