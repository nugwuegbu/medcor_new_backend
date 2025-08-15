# Doctor Availability Slots API Documentation

## Overview
The Doctor Availability Slots system allows doctors to define when they are available for appointments. Patients can then book appointments only during these available time slots. This ensures efficient scheduling and prevents double-booking.

## Base URL
```
http://localhost:8002/api/appointments/
```

## Authentication
All endpoints require JWT authentication. Include the token in headers:
```
Authorization: Bearer <access_token>
```

---

## Doctor Availability Slots

### 1. List Doctor Slots
**GET** `/api/appointments/slots/`

List all doctor availability slots.

**Query Parameters:**
- `doctor_id`: Filter by specific doctor
- `date`: Filter by specific date (YYYY-MM-DD)
- `start_date`: Filter slots from this date
- `end_date`: Filter slots until this date
- `status`: Filter by status (AVAILABLE, BOOKED, BLOCKED, etc.)
- `available_only`: If true, show only available slots
- `is_recurring`: Filter recurring slots

**Response:**
```json
[
  {
    "id": "uuid",
    "hospital": "hospital-uuid",
    "hospital_name": "Demo Hospital",
    "doctor": "doctor-uuid",
    "doctor_name": "Dr. John Smith",
    "doctor_email": "doctor@demo.com",
    "doctor_specialization": "Cardiologist",
    "date": "2025-01-20",
    "start_time": "09:00:00",
    "end_time": "09:30:00",
    "slot_duration_minutes": 30,
    "max_appointments": 1,
    "current_appointments": 0,
    "status": "AVAILABLE",
    "is_available": true,
    "is_past": false,
    "available_spots": 1,
    "time_slots": [
      {
        "start_time": "09:00:00",
        "end_time": "09:30:00",
        "available": true,
        "date": "2025-01-20"
      }
    ],
    "allowed_appointment_types": [],
    "advance_booking_days": 30,
    "minimum_notice_hours": 24,
    "created_at": "2025-01-16T10:00:00Z"
  }
]
```

### 2. Get Available Slots
**GET** `/api/appointments/slots/available/`

Get only available slots for booking.

**Query Parameters:**
- `doctor_id`: Filter by doctor
- `date`: Specific date (YYYY-MM-DD)
- `appointment_type`: Filter by appointment type

**Response:** Same as listing but only available slots

### 3. Create Doctor Slot
**POST** `/api/appointments/slots/`

Create a new availability slot.

**Request Body:**
```json
{
  "doctor": "doctor-uuid",
  "date": "2025-01-20",
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "slot_duration_minutes": 30,
  "max_appointments": 1,
  "generate_slots": true,  // If true, splits time into multiple slots
  "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"],
  "advance_booking_days": 30,
  "minimum_notice_hours": 24,
  "notes": "Regular clinic hours"
}
```

**Response:** Created slot(s) details

### 4. Generate Weekly Slots
**POST** `/api/appointments/slots/generate_weekly_slots/`

Generate recurring weekly slots for a doctor.

**Request Body:**
```json
{
  "doctor_id": "doctor-uuid",
  "start_date": "2025-01-20",
  "end_date": "2025-02-20",
  "daily_slots": {
    "0": [  // Monday
      {
        "start_time": "09:00:00",
        "end_time": "12:00:00",
        "duration": 30,
        "max_appointments": 1
      },
      {
        "start_time": "14:00:00",
        "end_time": "17:00:00",
        "duration": 30,
        "max_appointments": 1
      }
    ],
    "1": [  // Tuesday
      {
        "start_time": "09:00:00",
        "end_time": "12:00:00",
        "duration": 30
      }
    ]
    // 0=Monday, 1=Tuesday, ... 6=Sunday
  }
}
```

**Response:**
```json
{
  "message": "Created 120 slots",
  "slots": [...]
}
```

### 5. Block Slot
**POST** `/api/appointments/slots/{id}/block/`

Block a slot from being booked (e.g., doctor unavailable).

**Response:** Updated slot with status "BLOCKED"

### 6. Unblock Slot
**POST** `/api/appointments/slots/{id}/unblock/`

Make a blocked slot available again.

**Response:** Updated slot with status "AVAILABLE"

---

## Appointments with Slots

### 1. Book Appointment with Slot
**POST** `/api/appointments/appointments/`

Create an appointment using an available slot.

**Request Body:**
```json
{
  "patient": "patient-uuid",
  "doctor": "doctor-uuid",
  "slot": "slot-uuid",  // Links to availability slot
  "appointment_type": "CONSULTATION",
  "reason": "Regular checkup",
  "symptoms": "None",
  "notes": "First visit"
}
```

When a slot is provided:
- The appointment date/time is automatically set from the slot
- The slot's `current_appointments` is incremented
- If the slot reaches max capacity, it becomes "BOOKED"

**Response:**
```json
{
  "id": "appointment-uuid",
  "patient_name": "John Doe",
  "doctor_name": "Dr. Smith",
  "scheduled_date": "2025-01-20",
  "scheduled_time": "09:00:00",
  "slot_details": {
    "id": "slot-uuid",
    "status": "BOOKED",
    "current_appointments": 1
  }
}
```

### 2. Cancel Appointment
**POST** `/api/appointments/appointments/{id}/cancel/`

Cancel an appointment and release the slot.

**Request Body:**
```json
{
  "reason": "Patient requested cancellation"
}
```

When cancelled:
- The appointment status becomes "CANCELLED"
- If linked to a slot, the slot's `current_appointments` decreases
- The slot may become "AVAILABLE" again if not at capacity

---

## Workflow Examples

### Example 1: Doctor Sets Up Weekly Schedule
```bash
# 1. Create recurring slots for next month
curl -X POST http://localhost:8002/api/appointments/slots/generate_weekly_slots/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "doctor-uuid",
    "start_date": "2025-01-20",
    "end_date": "2025-02-20",
    "daily_slots": {
      "0": [{"start_time": "09:00", "end_time": "17:00", "duration": 30}],
      "1": [{"start_time": "09:00", "end_time": "17:00", "duration": 30}],
      "2": [{"start_time": "09:00", "end_time": "17:00", "duration": 30}],
      "3": [{"start_time": "09:00", "end_time": "17:00", "duration": 30}],
      "4": [{"start_time": "09:00", "end_time": "17:00", "duration": 30}]
    }
  }'
```

### Example 2: Patient Books Appointment
```bash
# 1. Get available slots for a doctor on specific date
curl "http://localhost:8002/api/appointments/slots/available/?doctor_id=xxx&date=2025-01-20" \
  -H "Authorization: Bearer <token>"

# 2. Book appointment using selected slot
curl -X POST http://localhost:8002/api/appointments/appointments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": "patient-uuid",
    "doctor": "doctor-uuid",
    "slot": "selected-slot-uuid",
    "appointment_type": "CONSULTATION",
    "reason": "Check-up"
  }'
```

### Example 3: Doctor Blocks Time Off
```bash
# Block slots for vacation/meeting
curl -X POST http://localhost:8002/api/appointments/slots/slot-uuid/block/ \
  -H "Authorization: Bearer <token>"
```

---

## Key Features

1. **Automatic Slot Management**
   - Slots automatically track booking capacity
   - Status changes from AVAILABLE to BOOKED when full
   - Cancellations automatically free up slots

2. **Flexible Scheduling**
   - Generate individual slots or bulk weekly schedules
   - Set different durations for different appointment types
   - Control advance booking and minimum notice periods

3. **Multi-Tenant Isolation**
   - Slots are isolated by hospital
   - Users only see slots within their hospital
   - Automatic hospital assignment from doctor

4. **Validation & Safety**
   - Prevents double-booking
   - Validates time conflicts
   - Ensures doctors and patients are from same hospital
   - Prevents booking slots in the past

5. **Rich Information**
   - Each slot shows doctor details
   - Real-time availability status
   - Number of available spots
   - Time slot breakdown

---

## Status Values

**Slot Status:**
- `AVAILABLE`: Open for booking
- `BOOKED`: At maximum capacity
- `BLOCKED`: Manually blocked by doctor/admin
- `BREAK`: Doctor break time
- `UNAVAILABLE`: Not available for other reasons

**Appointment Status:**
- `SCHEDULED`: Confirmed appointment
- `IN_PROGRESS`: Currently ongoing
- `COMPLETED`: Finished appointment
- `CANCELLED`: Cancelled by patient/doctor
- `NO_SHOW`: Patient didn't attend
- `RESCHEDULED`: Moved to different time