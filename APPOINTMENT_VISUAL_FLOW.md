# 📊 **MedCor Appointment System - Visual Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    🏥 MEDCOR APPOINTMENT SYSTEM                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   📋 TEMPLATES  │    │   ⏰ SLOTS      │    │   🏥 APPOINTMENTS│
│                 │    │                 │    │                 │
│ Weekly Patterns │───▶│ Bookable Times  │───▶│ Patient Bookings│
│                 │    │                 │    │                 │
│ • Mon-Fri 9-17  │    │ • 9:00-9:30     │    │ • Consultation  │
│ • 30min slots   │    │ • 9:30-10:00    │    │ • Follow-up     │
│ • Max 1 per slot│    │ • 10:00-10:30   │    │ • Emergency     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    📅 EXCEPTIONS                               │
│                                                                 │
│ Override regular schedules for:                                 │
│ • Holidays (Dec 25)                                            │
│ • Vacations (Dec 20-30)                                        │
│ • Conferences (Nov 15 AM)                                      │
│ • Sick leave                                                    │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

🎯 TYPICAL WORKFLOW:

1️⃣ SETUP DOCTOR SCHEDULE
   ┌─────────────────────────────────────────────────────────────┐
   │ POST /api/appointments/templates/bulk_create/               │
   │ {                                                           │
   │   "doctor": "uuid",                                         │
   │   "templates": [                                            │
   │     {"day_of_week": 0, "start_time": "09:00", "end_time": "17:00"}, │
   │     {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00"}, │
   │     {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00"}, │
   │     {"day_of_week": 3, "start_time": "09:00", "end_time": "17:00"}, │
   │     {"day_of_week": 4, "start_time": "09:00", "end_time": "17:00"}  │
   │   ]                                                         │
   │ }                                                           │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
2️⃣ GENERATE AVAILABLE SLOTS
   ┌─────────────────────────────────────────────────────────────┐
   │ POST /api/appointments/templates/generate_slots/             │
   │ {                                                           │
   │   "doctor": "uuid",                                         │
   │   "start_date": "2025-10-01",                              │
   │   "end_date": "2025-12-31",                                │
   │   "overwrite_existing": false                               │
   │ }                                                           │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
3️⃣ ADD HOLIDAY EXCEPTIONS
   ┌─────────────────────────────────────────────────────────────┐
   │ POST /api/appointments/exceptions/                          │
   │ {                                                           │
   │   "doctor": "uuid",                                         │
   │   "exception_type": "HOLIDAY",                              │
   │   "start_date": "2025-12-25",                              │
   │   "end_date": "2025-12-25",                                │
   │   "title": "Christmas Day"                                   │
   │ }                                                           │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
4️⃣ PATIENT CHECKS AVAILABILITY
   ┌─────────────────────────────────────────────────────────────┐
   │ POST /api/appointments/slots/check_availability/            │
   │ {                                                           │
   │   "doctor": "uuid",                                         │
   │   "date": "2025-10-15",                                     │
   │   "appointment_type": "CONSULTATION"                        │
   │ }                                                           │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
5️⃣ PATIENT BOOKS APPOINTMENT
   ┌─────────────────────────────────────────────────────────────┐
   │ POST /api/appointments/slots/{slot_id}/book/                │
   │ {                                                           │
   │   "appointment_type": "CONSULTATION",                       │
   │   "reason": "Regular checkup",                              │
   │   "notes": "Patient feeling tired",                         │
   │   "symptoms": "Fatigue, mild headache"                      │
   │ }                                                           │
   └─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

🔍 COMMON QUERIES:

📅 List Doctor's Schedule Templates:
GET /api/appointments/templates/?doctor=uuid

⏰ List Available Slots:
GET /api/appointments/slots/available/?doctor=uuid&date=2025-10-15

🏥 Today's Appointments:
GET /api/appointments/appointments/today/

📋 Upcoming Appointments:
GET /api/appointments/appointments/upcoming/

═══════════════════════════════════════════════════════════════════

⚠️  IMPORTANT NOTES:

✅ Always use templates for regular weekly schedules
✅ Generate slots in batches (monthly/quarterly)
✅ Book through slots rather than creating appointments directly
✅ Use exceptions for holidays and special events
✅ Check availability before showing options to patients

❌ Don't create slots manually unless absolutely necessary
❌ Don't create appointments without using slots
❌ Don't forget to add holiday exceptions
❌ Don't create slots more than 1 day in the past

═══════════════════════════════════════════════════════════════════

🎯 AUTHENTICATION:
All endpoints require: Authorization: Bearer <token>

📚 DOCUMENTATION:
Swagger UI: http://localhost:8000/api/docs/
Schema: http://localhost:8000/api/schema/
```
