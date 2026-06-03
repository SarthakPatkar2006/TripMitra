# TripMitra Database Design

## Overview

TripMitra is a travel planning platform that helps users create optimized trips based on duration, budget, preferences, and group participation. This document describes the MongoDB database schema and relationships used in the application.

---
#workflow
Requirements
    ↓
Database Design (database.md)
    ↓
API Design (api-design.md)
    ↓
Architecture Design
    ↓
Backend Setup
    ↓
Mongoose Models
    ↓
Controllers & Routes
    ↓
Frontend


# Database Collections

## 1. Users Collection

Stores user account information and authentication details.

### Schema

| Field        | Type     | Required | Description                |
| ------------ | -------- | -------- | -------------------------- |
| _id          | ObjectId | Yes      | Unique user identifier     |
| name         | String   | Yes      | User's full name           |
| email        | String   | Yes      | User email (unique)        |
| password     | String   | Yes      | Hashed password            |
| profileImage | String   | No       | Profile image URL          |
| createdAt    | Date     | Yes      | Account creation timestamp |
| updatedAt    | Date     | Yes      | Last update timestamp      |

### Example

```json
{
  "_id": "user123",
  "name": "Rohan Patil",
  "email": "rohan@gmail.com",
  "password": "hashed_password",
  "profileImage": "profile.jpg"
}
```

---

## 2. Trips Collection

Stores trip information created by users.

### Schema

| Field       | Type     | Required | Description                  |
| ----------- | -------- | -------- | ---------------------------- |
| _id         | ObjectId | Yes      | Unique trip identifier       |
| title       | String   | Yes      | Trip name                    |
| destination | String   | Yes      | Destination city/country     |
| startDate   | Date     | Yes      | Trip start date              |
| endDate     | Date     | Yes      | Trip end date                |
| totalDays   | Number   | Yes      | Duration of trip             |
| budget      | Number   | Yes      | Total trip budget            |
| owner       | ObjectId | Yes      | Reference to User            |
| status      | String   | Yes      | planning/completed/cancelled |
| createdAt   | Date     | Yes      | Creation timestamp           |
| updatedAt   | Date     | Yes      | Last update timestamp        |

### Example

```json
{
  "title": "Venice Adventure",
  "destination": "Venice",
  "totalDays": 5,
  "budget": 100000,
  "owner": "user123",
  "status": "planning"
}
```

---

## 3. Trip Members Collection

Manages group participation in trips.

### Schema

| Field    | Type     | Required | Description       |
| -------- | -------- | -------- | ----------------- |
| _id      | ObjectId | Yes      | Unique identifier |
| tripId   | ObjectId | Yes      | Reference to Trip |
| userId   | ObjectId | Yes      | Reference to User |
| role     | String   | Yes      | owner/member      |
| joinedAt | Date     | Yes      | Join timestamp    |

### Example

```json
{
  "tripId": "trip001",
  "userId": "user456",
  "role": "member"
}
```

---

## 4. Invitations Collection

Stores trip invitation information.

### Schema

| Field     | Type     | Required | Description                  |
| --------- | -------- | -------- | ---------------------------- |
| _id       | ObjectId | Yes      | Unique invitation identifier |
| tripId    | ObjectId | Yes      | Reference to Trip            |
| email     | String   | Yes      | Invited email                |
| invitedBy | ObjectId | Yes      | User who sent invite         |
| status    | String   | Yes      | pending/accepted/rejected    |
| createdAt | Date     | Yes      | Invitation timestamp         |

### Example

```json
{
  "tripId": "trip001",
  "email": "friend@gmail.com",
  "invitedBy": "user123",
  "status": "pending"
}
```

---

## 5. Itineraries Collection

Stores day-wise trip schedules.

### Schema

| Field      | Type     | Required | Description                    |
| ---------- | -------- | -------- | ------------------------------ |
| _id        | ObjectId | Yes      | Unique itinerary identifier    |
| tripId     | ObjectId | Yes      | Reference to Trip              |
| day        | Number   | Yes      | Trip day number                |
| activities | Array    | Yes      | Activities planned for the day |

### Activity Object

| Field     | Type   | Description       |
| --------- | ------ | ----------------- |
| name      | String | Activity name     |
| location  | String | Activity location |
| startTime | String | Start time        |
| endTime   | String | End time          |

### Example

```json
{
  "tripId": "trip001",
  "day": 1,
  "activities": [
    {
      "name": "St. Mark's Square",
      "location": "Venice",
      "startTime": "09:00",
      "endTime": "11:00"
    }
  ]
}
```

---

## 6. Notifications Collection

Stores notifications sent to users.

### Schema

| Field     | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| _id       | ObjectId | Yes      | Unique notification identifier |
| userId    | ObjectId | Yes      | Reference to User              |
| title     | String   | Yes      | Notification title             |
| message   | String   | Yes      | Notification message           |
| isRead    | Boolean  | Yes      | Read status                    |
| createdAt | Date     | Yes      | Notification timestamp         |

### Example

```json
{
  "userId": "user123",
  "title": "Trip Reminder",
  "message": "Your Venice trip starts tomorrow",
  "isRead": false
}
```

---

## 7. Hotels Collection (Future Enhancement)

Stores recommended hotels for trips.

### Schema

| Field     | Type     | Required | Description             |
| --------- | -------- | -------- | ----------------------- |
| _id       | ObjectId | Yes      | Unique hotel identifier |
| tripId    | ObjectId | Yes      | Reference to Trip       |
| hotelName | String   | Yes      | Hotel name              |
| price     | Number   | Yes      | Cost per night          |
| rating    | Number   | Yes      | Hotel rating            |
| address   | String   | Yes      | Hotel address           |

---

## 8. Transportation Collection (Future Enhancement)

Stores transport recommendations.

### Schema

| Field    | Type     | Required | Description                 |
| -------- | -------- | -------- | --------------------------- |
| _id      | ObjectId | Yes      | Unique transport identifier |
| tripId   | ObjectId | Yes      | Reference to Trip           |
| type     | String   | Yes      | Flight/Train/Bus/Cab        |
| provider | String   | Yes      | Service provider            |
| cost     | Number   | Yes      | Transport cost              |

---

# Database Relationships

```text
User
 ├── Creates ──────► Trip
 │
 ├── Receives ─────► Notification
 │
 └── Joins ────────► TripMember

Trip
 ├── Contains ────► Itinerary
 ├── Contains ────► Invitation
 ├── Contains ────► Hotel
 └── Contains ────► Transportation

TripMember
 ├── References ──► User
 └── References ──► Trip

Invitation
 ├── References ──► Trip
 └── References ──► User
```

---

# Indexing Strategy

## Users

```javascript
email: unique
```

## Trips

```javascript
owner
destination
status
```

## Trip Members

```javascript
tripId
userId
```

## Notifications

```javascript
userId
createdAt
```

---

# Future Scope

* AI-generated itineraries
* Real-time hotel recommendations
* Flight and transport integration
* Budget optimization engine
* Personalized destination recommendations
* Smart notification system
* Expense tracking and bill splitting

---

**Version:** 1.0

**Project:** TripMitra

**Database:** MongoDB

**Architecture Style:** Document-Oriented NoSQL Database
