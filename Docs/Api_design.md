# TripMitra API Design Document

## Version

v1.0

## Base URL

```http
/api/v1
```

---

# Authentication Module

## Register User

### Endpoint

```http
POST /auth/register
```

### Description

Creates a new user account.

### Request Body

```json
{
  "name": "Sarthak Anil Patkar",
  "email": "sarthakpatkar047@gmail.com",
  "password": "password123"
}
```

### Success Response

```json
{
  "success": true,
  "message": "User registered successfully"
}
```

---

## Login User

### Endpoint

```http
POST /auth/login
```

### Description

Authenticates a user and returns JWT token.

### Request Body

```json
{
  "email": "rohan@gmail.com",
  "password": "password123"
}
```

### Success Response

```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "_id": "123",
    "name": "Rohan Patil",
    "email": "rohan@gmail.com"
  }
}
```

---

## Get Current User

### Endpoint

```http
GET /auth/me
```

### Description

Returns currently logged-in user details.

---

# Trip Management Module

## Create Trip

### Endpoint

```http
POST /trips
```

### Description

Creates a new trip.

### Request Body

```json
{
  "title": "Venice Adventure",
  "destination": "Venice",
  "startDate": "2026-07-10",
  "endDate": "2026-07-15",
  "budget": 100000
}
```

### Success Response

```json
{
  "success": true,
  "tripId": "trip123"
}
```

---

## Get All Trips

### Endpoint

```http
GET /trips
```

### Description

Returns all trips created by the logged-in user.

---

## Get Trip By ID

### Endpoint

```http
GET /trips/:tripId
```

### Description

Returns complete trip information.

---

## Update Trip

### Endpoint

```http
PUT /trips/:tripId
```

### Description

Updates trip details.

---

## Delete Trip

### Endpoint

```http
DELETE /trips/:tripId
```

### Description

Deletes a trip.

---

# Trip Member Module

## Invite Member

### Endpoint

```http
POST /trips/:tripId/invite
```

### Description

Invites a user via email.

### Request Body

```json
{
  "email": "friend@gmail.com"
}
```

---

## Get Trip Members

### Endpoint

```http
GET /trips/:tripId/members
```

### Description

Returns all members associated with a trip.

---

## Remove Member

### Endpoint

```http
DELETE /trips/:tripId/members/:memberId
```

### Description

Removes a member from the trip.

---

# Invitation Module

## Accept Invitation

### Endpoint

```http
POST /invitations/:invitationId/accept
```

### Description

Accepts a pending invitation.

---

## Reject Invitation

### Endpoint

```http
POST /invitations/:invitationId/reject
```

### Description

Rejects a pending invitation.

---

## Get My Invitations

### Endpoint

```http
GET /invitations
```

### Description

Returns all invitations for the logged-in user.

---

# Itinerary Module

## Generate Itinerary

### Endpoint

```http
POST /trips/:tripId/itinerary/generate
```

### Description

Generates itinerary based on trip duration, destination, and user preferences.

### Request Body

```json
{
  "preferences": [
    "history",
    "food",
    "nature"
  ]
}

```

---

## Get Trip Itinerary

### Endpoint

```http
GET /trips/:tripId/itinerary
```

### Description

Returns complete itinerary.

---

## Update Day Plan

### Endpoint

```http
PUT /itinerary/:itineraryId
```

### Description

Updates activities for a particular day.

---

# Notification Module

## Get Notifications

### Endpoint

```http
GET /notifications
```

### Description

Returns all notifications of the logged-in user.

---

## Mark Notification As Read

### Endpoint

```http
PATCH /notifications/:notificationId/read
```

### Description

Marks notification as read.

---

# Hotel Recommendation Module (Future)

## Get Hotel Recommendations

### Endpoint

```http
GET /trips/:tripId/hotels
```

### Description

Returns hotel recommendations according to budget and destination.

---

# Transportation Module (Future)

## Get Transport Recommendations

### Endpoint

```http
GET /trips/:tripId/transportation
```

### Description

Returns recommended transportation options.

---

# Expense Tracking Module (Future)

## Add Expense

### Endpoint

```http
POST /trips/:tripId/expenses
```

### Description

Adds an expense to the trip.

---

## Get Expenses

### Endpoint

```http
GET /trips/:tripId/expenses
```

### Description

Returns all expenses for the trip.

---

# Security Requirements

## Protected Routes

All routes except:

```http
POST /auth/register
POST /auth/login
```

require JWT authentication.

---

# HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Resource Created      |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 500  | Internal Server Error |

---

# API Development Priority

## Phase 1

* Authentication Module
* Trip Management Module

## Phase 2

* Member Management
* Invitations

## Phase 3

* Itinerary Generation

## Phase 4

* Notifications

## Phase 5

* Hotels
* Transportation
* Expense Tracking

---

# Notes

* Authentication will use JWT.
* Passwords will be hashed using bcrypt.
* MongoDB will be used as the primary database.
* All timestamps should be stored in UTC.
* APIs should follow RESTful design principles.
