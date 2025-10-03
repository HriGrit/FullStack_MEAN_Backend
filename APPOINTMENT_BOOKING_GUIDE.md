# Hard-Coded Appointment Booking System

## Overview
This is a minimal, hard-coded appointment booking core for a healthcare portal. All doctors share the same schedule: **Monday through Friday, 10:00–18:00**, with exactly **8 fixed 1-hour slots** per working day.

## Schedule
- **Working Days**: Monday - Friday only
- **Working Hours**: 10:00 - 18:00
- **Slot Duration**: 1 hour (fixed)
- **Slots per Day**: 8 slots (0-7)

### Slot Times
```
slot 0 → 10:00–11:00
slot 1 → 11:00–12:00
slot 2 → 12:00–13:00
slot 3 → 13:00–14:00
slot 4 → 14:00–15:00
slot 5 → 15:00–16:00
slot 6 → 16:00–17:00
slot 7 → 17:00–18:00
```

## Database Setup

### Appointments Collection Schema
```javascript
{
  _id: ObjectId,
  doctorId: ObjectId,       // Reference to Doctor
  patientId: ObjectId,      // Reference to User
  date: String,             // "YYYY-MM-DD" format
  slot: Number,             // 0..7
  status: String,           // "BOOKED" | "CANCELLED"
  cancelledAt: Date,        // null or timestamp
  createdAt: Date,          // Auto-generated
  updatedAt: Date           // Auto-generated
}
```

### Required Index (Concurrency-Safe Booking)
Run this command in MongoDB shell or use MongoDB Compass to create the unique compound index:

```javascript
db.appointments.createIndex(
  { doctorId: 1, date: 1, slot: 1 },
  { unique: true }
);
```

This unique index ensures that:
- No two appointments can have the same (doctorId, date, slot) combination
- Concurrent booking attempts are handled atomically
- One booking succeeds, others get `SLOT_TAKEN` error

### Additional Indexes (Already Created via Schema)
```javascript
// For querying patient appointments
db.appointments.createIndex({ patientId: 1, date: 1 });

// For filtering by status
db.appointments.createIndex({ status: 1 });
```

## API Endpoints

### 1. Get Day Slots (Availability)
**Endpoint**: `GET /appointments/slots/:doctor_id?date=YYYY-MM-DD`

**Description**: Returns availability for all 8 slots for a given doctor and date.

**Authentication**: Required (JWT)

**Example Request**:
```bash
GET /appointments/slots/507f1f77bcf86cd799439011?date=2025-10-10
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "ok": true,
  "date": "2025-10-10",
  "doctorId": "507f1f77bcf86cd799439011",
  "slots": [
    {
      "slot": 0,
      "time": "10:00-11:00",
      "available": true,
      "bookedBy": null
    },
    {
      "slot": 1,
      "time": "11:00-12:00",
      "available": false,
      "bookedBy": "507f191e810c19729de860ea"
    },
    {
      "slot": 2,
      "time": "12:00-13:00",
      "available": true,
      "bookedBy": null
    },
    // ... slots 3-7
  ]
}
```

**Error Response - Invalid Date Format** (400):
```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid date format. Expected YYYY-MM-DD"
}
```

**Error Response - Weekend Date** (400):
```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Date must be a weekday (Monday-Friday)"
}
```

---

### 2. Book Appointment
**Endpoint**: `POST /appointments/book`

**Description**: Books an appointment atomically using MongoDB unique index for concurrency safety.

**Authentication**: Required (JWT, PATIENT role)

**Request Body**:
```json
{
  "doctor_id": "507f1f77bcf86cd799439011",
  "patient_id": "507f191e810c19729de860ea",
  "date": "2025-10-10",
  "slot": 2
}
```

**Success Response** (201 Created):
```json
{
  "ok": true,
  "appointment": {
    "_id": "65f8c9d4b2a3e1234567890a",
    "doctorId": "507f1f77bcf86cd799439011",
    "patientId": "507f191e810c19729de860ea",
    "date": "2025-10-10",
    "slot": 2,
    "time": "12:00-13:00",
    "status": "BOOKED",
    "createdAt": "2025-10-03T08:30:00.000Z"
  }
}
```

**Error Response - Slot Taken** (409 Conflict):
```json
{
  "ok": false,
  "code": "SLOT_TAKEN",
  "message": "Slot already booked for this doctor/date/slot"
}
```

**Error Response - Invalid Slot** (400):
```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Slot must be an integer between 0 and 7"
}
```

**Error Response - Weekend** (400):
```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Appointments only available Monday through Friday"
}
```

**Error Response - Past Date** (400):
```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Cannot book appointments in the past"
}
```

---

### 3. Cancel Appointment
**Endpoint**: `PATCH /appointments/:appointment_id/cancel`

**Description**: Cancels an appointment by setting status to CANCELLED and recording cancelledAt timestamp.

**Authentication**: Required (JWT, PATIENT role)

**Request Body**:
```json
{
  "patient_id": "507f191e810c19729de860ea"
}
```

**Success Response** (200 OK):
```json
{
  "ok": true,
  "appointment": {
    "_id": "65f8c9d4b2a3e1234567890a",
    "doctorId": "507f1f77bcf86cd799439011",
    "patientId": "507f191e810c19729de860ea",
    "date": "2025-10-10",
    "slot": 2,
    "status": "CANCELLED",
    "createdAt": "2025-10-03T08:30:00.000Z",
    "cancelledAt": "2025-10-03T10:15:00.000Z"
  }
}
```

**Error Response - Not Found** (404):
```json
{
  "ok": false,
  "code": "NOT_FOUND",
  "message": "Appointment not found"
}
```

**Error Response - Already Cancelled** (400):
```json
{
  "ok": false,
  "code": "ALREADY_CANCELLED",
  "message": "Appointment is already cancelled"
}
```

**Error Response - Not Authorized** (403):
```json
{
  "ok": false,
  "code": "NOT_AUTHORIZED",
  "message": "Not authorized to cancel this appointment"
}
```

---

## Usage Examples

### Example 1: Check Availability and Book
```bash
# Step 1: Check availability for doctor on 2025-10-10
curl -X GET \
  'http://localhost:5000/appointments/slots/507f1f77bcf86cd799439011?date=2025-10-10' \
  -H 'Authorization: Bearer <token>'

# Response shows slot 2 (12:00-13:00) is available

# Step 2: Book slot 2
curl -X POST \
  http://localhost:5000/appointments/book \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "doctor_id": "507f1f77bcf86cd799439011",
    "patient_id": "507f191e810c19729de860ea",
    "date": "2025-10-10",
    "slot": 2
  }'

# Success: Appointment booked
```

### Example 2: Concurrent Booking (Slot Taken)
```bash
# Patient A and Patient B both try to book the same slot at the same time

# Patient A request
curl -X POST http://localhost:5000/appointments/book \
  -H 'Authorization: Bearer <token_a>' \
  -H 'Content-Type: application/json' \
  -d '{
    "doctor_id": "507f1f77bcf86cd799439011",
    "patient_id": "patient_a_id",
    "date": "2025-10-10",
    "slot": 3
  }'

# Patient B request (nearly simultaneous)
curl -X POST http://localhost:5000/appointments/book \
  -H 'Authorization: Bearer <token_b>' \
  -H 'Content-Type: application/json' \
  -d '{
    "doctor_id": "507f1f77bcf86cd799439011",
    "patient_id": "patient_b_id",
    "date": "2025-10-10",
    "slot": 3
  }'

# Result:
# - One request succeeds: { "ok": true, "appointment": {...} }
# - Other request fails: { "ok": false, "code": "SLOT_TAKEN", ... }
```

### Example 3: Cancel Appointment
```bash
curl -X PATCH \
  http://localhost:5000/appointments/65f8c9d4b2a3e1234567890a/cancel \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "patient_id": "507f191e810c19729de860ea"
  }'

# Success: Appointment cancelled, cancelledAt timestamp set
```

### Example 4: Validation Errors
```bash
# Try to book on a weekend (Saturday)
curl -X POST http://localhost:5000/appointments/book \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "doctor_id": "507f1f77bcf86cd799439011",
    "patient_id": "507f191e810c19729de860ea",
    "date": "2025-10-11",
    "slot": 0
  }'

# Error Response:
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Appointments only available Monday through Friday"
}

# Try to book invalid slot
curl -X POST http://localhost:5000/appointments/book \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "doctor_id": "507f1f77bcf86cd799439011",
    "patient_id": "507f191e810c19729de860ea",
    "date": "2025-10-10",
    "slot": 10
  }'

# Error Response:
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Slot must be an integer between 0 and 7"
}
```

## Validation Rules

### Server-Side Validations
1. **Slot**: Must be integer 0-7
2. **Date Format**: Must be valid "YYYY-MM-DD" string
3. **Weekday**: Date must correspond to Monday-Friday (Date.getDay() = 1-5)
4. **Past Dates**: Appointments cannot be booked for past dates
5. **Authorization**: Only the patient who booked can cancel their appointment

## Concurrency Safety

The system uses MongoDB's unique compound index to ensure concurrency-safe booking:

1. **Atomic Insert**: Uses single `insertOne` operation
2. **Unique Index**: `{ doctorId: 1, date: 1, slot: 1 }` with unique constraint
3. **No Locks**: No application-level locks or transactions needed
4. **Duplicate Key Error**: MongoDB returns error code 11000 if slot already taken
5. **Automatic Retry**: Client should retry with different slot if SLOT_TAKEN

## Edge Cases

### Double Booking Prevention
- Unique index prevents two appointments for same (doctor, date, slot)
- If two requests arrive simultaneously, MongoDB guarantees one succeeds
- Losing request gets `SLOT_TAKEN` error code

### Weekend Bookings
- System rejects Saturday (day 6) and Sunday (day 0)
- Only Monday (1) through Friday (5) allowed

### Past Date Bookings
- System compares appointment date with today's date
- Rejects any booking for dates before today

### Cancelled Appointments
- Status changed to "CANCELLED"
- `cancelledAt` timestamp recorded
- Document preserved for audit trail (not deleted)
- Slot becomes available for new bookings

### Patient Authorization
- Only the patient who created the appointment can cancel it
- `patient_id` in request body must match `appointment.patientId`

## Sample Documents

### Booked Appointment
```json
{
  "_id": ObjectId("65f8c9d4b2a3e1234567890a"),
  "doctorId": ObjectId("507f1f77bcf86cd799439011"),
  "patientId": ObjectId("507f191e810c19729de860ea"),
  "date": "2025-10-10",
  "slot": 2,
  "status": "BOOKED",
  "cancelledAt": null,
  "createdAt": ISODate("2025-10-03T08:30:00.000Z"),
  "updatedAt": ISODate("2025-10-03T08:30:00.000Z")
}
```

### Cancelled Appointment
```json
{
  "_id": ObjectId("65f8c9d4b2a3e1234567890a"),
  "doctorId": ObjectId("507f1f77bcf86cd799439011"),
  "patientId": ObjectId("507f191e810c19729de860ea"),
  "date": "2025-10-10",
  "slot": 2,
  "status": "CANCELLED",
  "cancelledAt": ISODate("2025-10-03T10:15:00.000Z"),
  "createdAt": ISODate("2025-10-03T08:30:00.000Z"),
  "updatedAt": ISODate("2025-10-03T10:15:00.000Z")
}
```

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SLOT_TAKEN` | 409 | The requested slot is already booked |
| `VALIDATION_ERROR` | 400 | Input validation failed (invalid slot, date, format, weekday, past date) |
| `NOT_FOUND` | 404 | Appointment ID not found |
| `NOT_AUTHORIZED` | 403 | Patient not authorized to cancel this appointment |
| `ALREADY_CANCELLED` | 400 | Appointment already cancelled |
| `SERVER_ERROR` | 500 | Database or server error |

## Implementation Notes

### What's NOT Included (By Design)
- ❌ No timezone conversions (dates are literal "YYYY-MM-DD" strings)
- ❌ No variable appointment durations (always 1 hour)
- ❌ No overlapping time calculations (fixed slots 0-7)
- ❌ No UI/frontend
- ❌ No notifications or emails
- ❌ No payment processing
- ❌ No automated tests
- ❌ No doctor-specific schedules (all share same schedule)

### What's Included
- ✅ Hard-coded Monday-Friday, 10:00-18:00 schedule
- ✅ Fixed 8 slots per day (1-hour each)
- ✅ Concurrency-safe booking via unique index
- ✅ Atomic insert operations
- ✅ Comprehensive validation
- ✅ Error handling with specific error codes
- ✅ Audit trail (cancelled appointments not deleted)
- ✅ Patient authorization for cancellation

## Database Index Verification

To verify the unique index was created:
```javascript
// MongoDB Shell
db.appointments.getIndexes()

// Expected output should include:
{
  "v": 2,
  "key": {
    "doctorId": 1,
    "date": 1,
    "slot": 1
  },
  "name": "doctorId_1_date_1_slot_1",
  "unique": true
}
```

## Deployment Checklist

1. ✅ Update appointment model schema
2. ✅ Implement three core functions (getDaySlots, bookAppointment, cancelAppointment)
3. ✅ Update routes
4. ⚠️ **Create unique compound index in MongoDB** (see Database Setup section)
5. ⚠️ Test with concurrent booking attempts
6. ⚠️ Verify weekend dates are rejected
7. ⚠️ Verify past dates are rejected
8. ⚠️ Test cancellation authorization

---

**Last Updated**: October 3, 2025
**Version**: 1.0.0

