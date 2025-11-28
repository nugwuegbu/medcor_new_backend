# 🚀 **MedCor Appointment System - Quick Reference**

## **Core Flow**

```
Templates → Generate Slots → Book Appointments
    ↓
Exceptions (Override schedules)
```

## **Key Endpoints**

### **📋 Templates (Weekly Patterns)**

```bash
# Create weekly schedule
POST /api/appointments/templates/bulk_create/

# Generate slots from templates
POST /api/appointments/templates/generate_slots/
```

### **⏰ Slots (Bookable Times)**

```bash
# List available slots
GET /api/appointments/slots/available/?doctor=uuid&date=2025-10-15

# Book appointment through slot
POST /api/appointments/slots/{slot_id}/book/
```

### **🏥 Appointments (Patient Bookings)**

```bash
# Today's appointments
GET /api/appointments/appointments/today/

# Complete appointment
POST /api/appointments/appointments/{id}/complete/
```

### **📅 Exceptions (Holidays/Vacations)**

```bash
# Create holiday exception
POST /api/appointments/exceptions/
```

## **Common Patterns**

### **Setup New Doctor**

1. Create templates (bulk_create)
2. Generate slots (generate_slots)
3. Add exceptions (holidays)

### **Patient Books Appointment**

1. Check availability (check_availability)
2. Book through slot (book)

### **Doctor Manages Schedule**

1. View today (today)
2. Complete appointments (complete)
3. Add emergency slots (create slot)

## **Field Values**

**Days:** 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun

**Appointment Types:** CONSULTATION, FOLLOW_UP, ROUTINE_CHECKUP, EMERGENCY, TELEMEDICINE

**Slot Status:** AVAILABLE, BOOKED, BLOCKED, BREAK, UNAVAILABLE

**Exception Types:** HOLIDAY, VACATION, SICK_LEAVE, CONFERENCE, EMERGENCY

## **Authentication Required**

All endpoints need: `Authorization: Bearer <token>`

## **Swagger Docs**

`http://localhost:8000/api/docs/`
