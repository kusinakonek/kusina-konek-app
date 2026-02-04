# KusinaKonek Server (Express + Prisma + Supabase)

This folder contains the backend API for KusinaKonek.

## Quick start

From repo root:

- Install deps: `npm install`
- Generate Prisma client: `npm run db:generate`
- Run server (dev): `npm run dev:server`

Health checks:
- `GET /health`
- `GET /db-check`

## Auth

All protected routes require:

- `Authorization: Bearer <access_token>`

### `POST /api/auth/signup`
Body:
```json
{ "email": "user@example.com", "password": "password123", "displayName": "Juan Dela Cruz", "role": "DONOR" }
```

### `POST /api/auth/login`
Body:
```json
{ "email": "user@example.com", "password": "password123" }
```

### `GET /api/auth/me`
Returns:
- `profileCompleted: boolean`
- `user` (DB-backed if profile exists; otherwise token-derived)

## Profile completion (required)

The DB `User` table has required fields (name, phone, roleID, hashes). After Supabase signup, call this once to create/update the relational profile.

### `PUT /api/users/profile` (protected)
Body:
```json
{
  "firstName": "Juan",
  "middleName": "Santos",
  "lastName": "Dela Cruz",
  "suffix": "Jr",
  "phoneNo": "09171234567",
  "isOrg": false,
  "address": {
    "latitude": 14.5995,
    "longitude": 120.9842,
    "streetAddress": "123 Rizal St.",
    "barangay": "Barangay 1"
  }
}
```
Notes:
- `roleID` is derived from your JWT’s `user_metadata.role` (must be `DONOR` or `RECIPIENT`).
- `emailHash` and `phoneNoHash` are generated server-side (sha256).

## Foods

Most features require a completed profile.

### `POST /api/foods` (protected, DONOR only)
Body:
```json
{
  "foodName": "Chicken Adobo",
  "dateCooked": "2026-02-04T12:00:00.000Z",
  "description": "Homemade adobo",
  "quantity": 10,
  "image": "https://example.com/adobo.jpg"
}
```

### `GET /api/foods/mine` (protected)
List foods for the authenticated user.

### `GET /api/foods/:foodID` (protected)

### `PATCH /api/foods/:foodID` (protected, DONOR only)
Body (any subset):
```json
{ "quantity": 20 }
```

### `DELETE /api/foods/:foodID` (protected, DONOR only)

## Drop-off locations

### `POST /api/locations` (protected)
Body:
```json
{
  "foodID": "<optional-food-uuid>",
  "latitude": 14.6,
  "longitude": 121.0,
  "streetAddress": "Community Center",
  "barangay": "Barangay Hall"
}
```

### `GET /api/locations/mine` (protected)

### `GET /api/locations/food/:foodID` (protected)

### `PATCH /api/locations/:locID` (protected)
Body (any subset):
```json
{ "foodID": null }
```

### `DELETE /api/locations/:locID` (protected)

## Distributions

### `POST /api/distributions` (protected, DONOR only)
Body:
```json
{
  "recipientID": "<recipient-userID>",
  "locID": "<drop-off-locID>",
  "foodID": "<foodID>",
  "quantity": 5,
  "scheduledTime": "2026-02-05T12:00:00.000Z",
  "photoProof": "https://example.com/proof.jpg"
}
```

### `GET /api/distributions/mine` (protected)

### `POST /api/distributions/:disID/complete` (protected)
Body:
```json
{ "actualTime": "2026-02-05T12:30:00.000Z" }
```
If omitted, server uses current time.

## Feedback

### `POST /api/feedback` (protected)
Body:
```json
{ "disID": "<distribution-id>", "ratingScore": 5, "comments": "Thank you!" }
```

### `GET /api/feedback/distribution/:disID` (protected)

## Useful curl examples

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Complete profile (replace TOKEN)
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Juan","lastName":"Dela Cruz","phoneNo":"09171234567"}'
```
