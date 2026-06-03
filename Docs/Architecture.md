# TripMitra System Architecture

## Version

v1.0

## Overview

TripMitra is a MERN-based travel planning platform that helps users create optimized trips based on destination, budget, duration, and preferences. The platform also supports group trip planning, itinerary generation, notifications, and future AI-powered recommendations.

---

# System Architecture

```text
┌─────────────────┐
│     Client      │
│   (React App)   │
└────────┬────────┘
         │ HTTP Requests
         ▼
┌─────────────────┐
│  Express Server │
│   REST APIs     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Business Logic  │
│    Services     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
│   Database      │
└─────────────────┘
```

---

# High-Level Architecture

```text
User
 │
 ▼
React Frontend
 │
 ▼
API Gateway (Express.js)
 │
 ├── Authentication Service
 │
 ├── Trip Service
 │
 ├── Invitation Service
 │
 ├── Itinerary Service
 │
 ├── Notification Service
 │
 ▼
MongoDB Database
```

---

# Technology Stack

## Frontend

| Technology          | Purpose           |
| ------------------- | ----------------- |
| React.js            | User Interface    |
| React Router        | Routing           |
| Axios               | API Communication |
| Tailwind CSS        | Styling           |
| Context API / Redux | State Management  |

---

## Backend

| Technology | Purpose             |
| ---------- | ------------------- |
| Node.js    | Runtime Environment |
| Express.js | REST API Framework  |
| JWT        | Authentication      |
| bcrypt     | Password Hashing    |
| Nodemailer | Email Invitations   |

---

## Database

| Technology | Purpose          |
| ---------- | ---------------- |
| MongoDB    | Primary Database |
| Mongoose   | ODM Layer        |

---

## Deployment

| Component | Platform      |
| --------- | ------------- |
| Frontend  | Vercel        |
| Backend   | Render        |
| Database  | MongoDB Atlas |

---

# Backend Layered Architecture

The backend follows a layered architecture pattern.

```text
Routes
  │
  ▼
Controllers
  │
  ▼
Services
  │
  ▼
Models
  │
  ▼
MongoDB
```

---

# Responsibilities

## Routes Layer

Responsible for:

* Defining API endpoints
* Handling URL mapping
* Applying middleware

Example:

```text
POST /api/v1/auth/login
GET /api/v1/trips
```

---

## Controllers Layer

Responsible for:

* Receiving requests
* Validating input
* Calling services
* Sending responses

Example:

```text
TripController
AuthController
InvitationController
```

---

## Services Layer

Responsible for:

* Business logic
* Data processing
* Third-party integrations

Example:

```text
Generate itinerary
Calculate budget
Send invitation email
```

---

## Models Layer

Responsible for:

* Database schemas
* Database operations
* Data validation

Example:

```text
User Model
Trip Model
Invitation Model
```

---

# Backend Folder Structure

```text
backend/
│
├── src
│
├── config
│   ├── db.js
│   └── env.js
│
├── models
│   ├── User.js
│   ├── Trip.js
│   ├── TripMember.js
│   ├── Invitation.js
│   ├── Itinerary.js
│   └── Notification.js
│
├── controllers
│   ├── auth.controller.js
│   ├── trip.controller.js
│   ├── invitation.controller.js
│   ├── itinerary.controller.js
│   └── notification.controller.js
│
├── services
│   ├── auth.service.js
│   ├── trip.service.js
│   ├── invitation.service.js
│   └── itinerary.service.js
│
├── routes
│   ├── auth.routes.js
│   ├── trip.routes.js
│   ├── invitation.routes.js
│   ├── itinerary.routes.js
│   └── notification.routes.js
│
├── middleware
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
│
├── utils
│   ├── jwt.js
│   ├── email.js
│   └── response.js
│
├── app.js
└── server.js
```

---

# Frontend Folder Structure

```text
frontend/
│
├── src
│
├── pages
│   ├── Login
│   ├── Register
│   ├── Dashboard
│   ├── CreateTrip
│   ├── TripDetails
│   └── Profile
│
├── components
│   ├── Navbar
│   ├── Sidebar
│   ├── TripCard
│   └── ProtectedRoute
│
├── services
│   └── api.js
│
├── context
│   └── AuthContext.jsx
│
├── hooks
│
├── utils
│
└── App.jsx
```

---

# Authentication Flow

```text
User Login
     │
     ▼
POST /auth/login
     │
     ▼
Verify Credentials
     │
     ▼
Generate JWT Token
     │
     ▼
Return Token
     │
     ▼
Store Token in Client
```

---

# Trip Creation Flow

```text
User
 │
 ▼
Create Trip Form
 │
 ▼
POST /trips
 │
 ▼
Trip Controller
 │
 ▼
Trip Service
 │
 ▼
Trip Model
 │
 ▼
MongoDB
```

---

# Group Invitation Flow

```text
Trip Owner
 │
 ▼
Invite User
 │
 ▼
POST /trips/:tripId/invite
 │
 ▼
Create Invitation
 │
 ▼
Send Email
 │
 ▼
Invitation Stored
```

---

# Security Architecture

## Authentication

* JWT Based Authentication
* Password Hashing using bcrypt
* Protected Routes

---

## Authorization

Role-Based Access Control (RBAC)

Roles:

```text
Owner
Member
```

Permissions:

| Action         | Owner | Member |
| -------------- | ----- | ------ |
| Create Trip    | Yes   | No     |
| Update Trip    | Yes   | No     |
| Delete Trip    | Yes   | No     |
| Invite Members | Yes   | No     |
| View Trip      | Yes   | Yes    |

---

# Future Integrations

## Maps Integration

Purpose:

* Route optimization
* Distance calculation
* Navigation

Provider:

```text
Google Maps API
```

---

## Hotel Recommendation System

Purpose:

* Budget-friendly hotel suggestions
* Hotel comparison

---

## AI Itinerary Generator

Purpose:

* Personalized travel plans
* Budget optimization
* Activity recommendations

---

# Scalability Considerations

Future improvements:

* Redis Caching
* Rate Limiting
* Microservices Architecture
* Real-Time Notifications
* WebSockets
* AI Recommendation Engine

---

# Architecture Principles

* Separation of Concerns
* RESTful API Design
* Modular Structure
* Reusable Components
* Scalable Folder Structure
* Security First Approach

---

# Development Workflow

```text
Requirements
    ↓
Database Design
    ↓
API Design
    ↓
Architecture Design
    ↓
Backend Development
    ↓
Frontend Development
    ↓
Testing
    ↓
Deployment
```

---

# Project Status

✅ Requirements Completed

✅ Database Design Completed

✅ API Design Completed

✅ Architecture Design Completed

⬜ Backend Development

⬜ Frontend Development

⬜ Testing

⬜ Deployment

---

**Project:** TripMitra

**Architecture Style:** Monolithic MERN Application

**Database:** MongoDB

**Backend Framework:** Express.js

**Frontend Framework:** React.js
