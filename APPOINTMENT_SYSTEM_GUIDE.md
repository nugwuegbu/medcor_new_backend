# 📅 **MedCor Appointment System - Complete User Guide**

## 🎯 **Overview**

The MedCor appointment system uses a **3-tier architecture** for maximum flexibility and efficiency:

1. **📋 Schedule Templates** - Set up recurring weekly patterns
2. **⏰ Schedule Slots** - Individual bookable time slots
3. **📅 Schedule Exceptions** - Override regular schedules for specific dates
4. **🏥 Appointments** - Actual patient appointments

---

## 🚀 **Quick Start Flow**

### **Step 1: Set Up Doctor's Weekly Schedule**

### **Step 2: Generate Available Slots**

### **Step 3: Book Appointments**

### **Step 4: Manage Exceptions**

---

## 📋 **1. SCHEDULE TEMPLATES (Weekly Patterns)**

Schedule templates define a doctor's recurring weekly availability. This is the **primary method** for setting up schedules.

### **1.1 Create Individual Schedule Template**

```http
POST /api/appointments/templates/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "doctor": "doctor_uuid_here",
    "day_of_week": 0,
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "slot_duration_minutes": 30,
    "max_appointments_per_slot": 1,
    "is_available": true,
    "advance_booking_days": 30,
    "minimum_notice_hours": 24,
    "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP", "ROUTINE_CHECKUP"]
}
```

**Day of Week Values:**

- `0` = Monday
- `1` = Tuesday
- `2` = Wednesday
- `3` = Thursday
- `4` = Friday
- `5` = Saturday
- `6` = Sunday

### **1.2 Create Multiple Templates at Once (Bulk)**

```http
POST /api/appointments/templates/bulk_create/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "doctor": "doctor_uuid_here",
    "templates": [
        {
            "day_of_week": 0,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "max_appointments_per_slot": 1,
            "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
        },
        {
            "day_of_week": 1,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "max_appointments_per_slot": 1,
            "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
        },
        {
            "day_of_week": 2,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "max_appointments_per_slot": 1,
            "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
        },
        {
            "day_of_week": 3,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "max_appointments_per_slot": 1,
            "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
        },
        {
            "day_of_week": 4,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "max_appointments_per_slot": 1,
            "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
        }
    ]
}
```

### **1.3 List Doctor's Schedule Templates**

```http
GET /api/appointments/templates/?doctor=doctor_uuid_here
Authorization: Bearer <your_token>
```

---

## ⏰ **2. SCHEDULE SLOTS (Individual Time Slots)**

Schedule slots are the actual bookable time slots generated from templates or created manually.

### **2.1 Generate Slots from Templates**

This is the **recommended approach** - generate slots automatically from your weekly templates.

```http
POST /api/appointments/templates/generate_slots/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "doctor": "doctor_uuid_here",
    "start_date": "2025-10-01",
    "end_date": "2025-12-31",
    "overwrite_existing": false
}
```

**Response:** Returns all generated slots

### **2.2 Create Individual Slot (Manual)**

For one-off slots or special appointments:

```http
POST /api/appointments/slots/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "doctor": "doctor_uuid_here",
    "date": "2025-10-15",
    "start_time": "14:00:00",
    "end_time": "15:00:00",
    "duration_minutes": 60,
    "max_appointments": 1,
    "status": "AVAILABLE",
    "allowed_appointment_types": ["CONSULTATION"],
    "notes": "Special extended consultation slot"
}
```

### **2.3 List Available Slots**

```http
GET /api/appointments/slots/available/?doctor=doctor_uuid_here&date=2025-10-15
Authorization: Bearer <your_token>
```

### **2.4 List All Slots with Filters**

```http
GET /api/appointments/slots/?doctor=doctor_uuid_here&date=2025-10-15&status=AVAILABLE
Authorization: Bearer <your_token>
```

---

## 🏥 **3. APPOINTMENTS (Patient Bookings)**

### **3.1 Book Appointment Through Slot (Recommended)**

This is the **easiest and safest** way to book appointments:

**Note**: The `patient_id` field is required to specify which patient is booking the appointment. This allows any authenticated user (doctor, admin, etc.) to book appointments on behalf of patients.

```http
POST /api/appointments/slots/{slot_id}/book/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "patient_id": "040e1d0a-e4e9-4af3-b672-82efc61075c2",
    "appointment_type": "CONSULTATION",
    "reason": "Regular checkup",
    "notes": "Patient has been feeling tired lately",
    "symptoms": "Fatigue, mild headache"
}
```

### **3.2 Create Appointment Directly**

For more control over appointment creation:

```http
POST /api/appointments/appointments/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "patient": "patient_uuid_here",
    "doctor": "doctor_uuid_here",
    "appointment_type": "CONSULTATION",
    "priority": "NORMAL",
    "scheduled_date": "2025-10-15",
    "scheduled_time": "14:00:00",
    "duration_minutes": 30,
    "slot": "slot_uuid_here",
    "reason": "Regular checkup",
    "notes": "Patient notes",
    "symptoms": "Patient symptoms"
}
```

### **3.3 List Appointments**

```http
GET /api/appointments/appointments/?doctor=doctor_uuid_here&scheduled_date=2025-10-15
Authorization: Bearer <your_token>
```

### **3.4 Get Today's Appointments**

```http
GET /api/appointments/appointments/today/
Authorization: Bearer <your_token>
```

### **3.5 Get Upcoming Appointments**

```http
GET /api/appointments/appointments/upcoming/
Authorization: Bearer <your_token>
```

### **3.6 Cancel Appointment**

```http
POST /api/appointments/appointments/{appointment_id}/cancel/
Authorization: Bearer <your_token>
```

### **3.7 Complete Appointment**

```http
POST /api/appointments/appointments/{appointment_id}/complete/
Authorization: Bearer <your_token>
```

---

## 📅 **4. SCHEDULE EXCEPTIONS (Holidays, Vacations)**

Use exceptions to override regular schedules for specific dates.

### **4.1 Create Schedule Exception**

```http
POST /api/appointments/exceptions/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "doctor": "doctor_uuid_here",
    "exception_type": "HOLIDAY",
    "start_date": "2025-12-25",
    "end_date": "2025-12-25",
    "title": "Christmas Day",
    "description": "Hospital closed for Christmas"
}
```

### **4.2 Create Partial Day Exception**

```http
POST /api/appointments/exceptions/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "doctor": "doctor_uuid_here",
    "exception_type": "CONFERENCE",
    "start_date": "2025-11-15",
    "end_date": "2025-11-15",
    "start_time": "09:00:00",
    "end_time": "12:00:00",
    "title": "Medical Conference",
    "description": "Doctor attending morning conference"
}
```

### **4.3 Create Vacation Exception**

```http
POST /api/appointments/exceptions/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "doctor": "doctor_uuid_here",
    "exception_type": "VACATION",
    "start_date": "2025-12-20",
    "end_date": "2025-12-30",
    "title": "Holiday Vacation",
    "description": "Doctor on vacation"
}
```

---

## 🔍 **5. CHECKING AVAILABILITY**

### **5.1 Check Doctor Availability for Specific Date**

```http
POST /api/appointments/slots/check_availability/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "doctor": "doctor_uuid_here",
    "date": "2025-10-15",
    "appointment_type": "CONSULTATION"
}
```

**Response:**

```json
{
  "doctor": "doctor_uuid_here",
  "date": "2025-10-15",
  "available_slots": [
    {
      "id": "slot_uuid_1",
      "start_time": "09:00:00",
      "end_time": "09:30:00",
      "status": "AVAILABLE",
      "can_be_booked": true
    },
    {
      "id": "slot_uuid_2",
      "start_time": "09:30:00",
      "end_time": "10:00:00",
      "status": "AVAILABLE",
      "can_be_booked": true
    }
  ]
}
```

---

## 🎯 **6. COMPLETE WORKFLOW EXAMPLES**

### **Example 1: Setting Up a New Doctor's Schedule**

```bash
# 1. Create weekly schedule templates
curl -X POST http://localhost:8000/api/appointments/templates/bulk_create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "doctor": "doctor_uuid",
    "templates": [
      {"day_of_week": 0, "start_time": "09:00", "end_time": "17:00", "slot_duration_minutes": 30},
      {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "slot_duration_minutes": 30},
      {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00", "slot_duration_minutes": 30},
      {"day_of_week": 3, "start_time": "09:00", "end_time": "17:00", "slot_duration_minutes": 30},
      {"day_of_week": 4, "start_time": "09:00", "end_time": "17:00", "slot_duration_minutes": 30}
    ]
  }'

# 2. Generate slots for next 3 months
curl -X POST http://localhost:8000/api/appointments/templates/generate_slots/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "doctor": "doctor_uuid",
    "start_date": "2025-10-01",
    "end_date": "2025-12-31",
    "overwrite_existing": false
  }'

# 3. Add holiday exception
curl -X POST http://localhost:8000/api/appointments/exceptions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "doctor": "doctor_uuid",
    "exception_type": "HOLIDAY",
    "start_date": "2025-12-25",
    "end_date": "2025-12-25",
    "title": "Christmas Day"
  }'
```

### **Example 2: Patient Booking an Appointment**

```bash
# 1. Check doctor availability
curl -X POST http://localhost:8000/api/appointments/slots/check_availability/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <patient_token>" \
  -d '{
    "doctor": "doctor_uuid",
    "date": "2025-10-15",
    "appointment_type": "CONSULTATION"
  }'

# 2. Book appointment through available slot
curl -X POST http://localhost:8000/api/appointments/slots/slot_uuid/book/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <patient_token>" \
  -d '{
    "appointment_type": "CONSULTATION",
    "reason": "Regular checkup",
    "notes": "Patient feeling tired",
    "symptoms": "Fatigue, mild headache"
  }'
```

### **Example 3: Doctor Managing Their Schedule**

```bash
# 1. View today's appointments
curl -X GET http://localhost:8000/api/appointments/appointments/today/ \
  -H "Authorization: Bearer <doctor_token>"

# 2. Complete an appointment
curl -X POST http://localhost:8000/api/appointments/appointments/appointment_uuid/complete/ \
  -H "Authorization: Bearer <doctor_token>"

# 3. Add emergency slot for today
curl -X POST http://localhost:8000/api/appointments/slots/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <doctor_token>" \
  -d '{
    "doctor": "doctor_uuid",
    "date": "2025-10-01",
    "start_time": "18:00:00",
    "end_time": "19:00:00",
    "duration_minutes": 60,
    "status": "AVAILABLE",
    "notes": "Emergency consultation slot"
  }'
```

---

## 📊 **7. FIELD REFERENCE**

### **Appointment Types**

- `CONSULTATION` - General consultation
- `FOLLOW_UP` - Follow-up appointment
- `ROUTINE_CHECKUP` - Routine checkup
- `EMERGENCY` - Emergency appointment
- `TELEMEDICINE` - Telemedicine appointment
- `VACCINATION` - Vaccination appointment
- `LAB_TEST` - Lab test appointment
- `SURGERY` - Surgery appointment
- `THERAPY` - Therapy appointment
- `SCREENING` - Screening appointment

### **Appointment Status**

- `SCHEDULED` - Appointment scheduled
- `CONFIRMED` - Appointment confirmed
- `IN_PROGRESS` - Appointment in progress
- `COMPLETED` - Appointment completed
- `CANCELLED` - Appointment cancelled
- `NO_SHOW` - Patient didn't show up
- `RESCHEDULED` - Appointment rescheduled

### **Slot Status**

- `AVAILABLE` - Available for booking
- `BOOKED` - Fully booked
- `BLOCKED` - Blocked (not available)
- `BREAK` - Break time
- `UNAVAILABLE` - Unavailable

### **Exception Types**

- `HOLIDAY` - Holiday
- `VACATION` - Vacation
- `SICK_LEAVE` - Sick leave
- `CONFERENCE` - Conference
- `EMERGENCY` - Emergency
- `CUSTOM` - Custom exception

---

## ⚠️ **8. IMPORTANT NOTES**

### **Authentication**

- All endpoints require authentication
- Use `Authorization: Bearer <token>` header
- Different user roles have different access levels

### **Validation**

- Slots cannot be created more than 1 day in the past
- Appointments cannot be scheduled more than 1 day in the past
- Overlapping slots are automatically prevented
- Appointment types must match slot restrictions

### **Best Practices**

1. **Use templates** for regular weekly schedules
2. **Generate slots** in batches (monthly/quarterly)
3. **Book through slots** rather than creating appointments directly
4. **Use exceptions** for holidays and special events
5. **Check availability** before showing options to patients

### **Error Handling**

- All endpoints return proper HTTP status codes
- Validation errors include detailed messages
- Check response body for specific error details

---

## 🎉 **You're Ready!**

This system provides maximum flexibility while maintaining data integrity. Start with templates, generate slots, and let patients book appointments easily!

For more help, check the Swagger documentation at: `http://localhost:8000/api/docs/`
