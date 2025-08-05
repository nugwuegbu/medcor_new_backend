-- Create treatment table
CREATE TABLE IF NOT EXISTS treatment_treatment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tenant_id INTEGER REFERENCES tenants_client(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create slot table
CREATE TABLE IF NOT EXISTS appointment_slot (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES tenants_user(id),
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create appointment table
CREATE TABLE IF NOT EXISTS appointment_appointment (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES tenants_user(id),
    doctor_id INTEGER NOT NULL REFERENCES tenants_user(id),
    slot_id INTEGER NOT NULL REFERENCES appointment_slot(id),
    treatment_id INTEGER NOT NULL REFERENCES treatment_treatment(id),
    appointment_slot_date DATE NOT NULL,
    appointment_slot_start_time TIME NOT NULL,
    appointment_slot_end_time TIME NOT NULL,
    appointment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    medical_record TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create slot exclusion table  
CREATE TABLE IF NOT EXISTS appointment_slotexclusion (
    id SERIAL PRIMARY KEY,
    slot_id INTEGER NOT NULL REFERENCES appointment_slot(id),
    exclusion_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointment_patient ON appointment_appointment(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_doctor ON appointment_appointment(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_date ON appointment_appointment(appointment_slot_date);
CREATE INDEX IF NOT EXISTS idx_slot_doctor ON appointment_slot(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatment_tenant ON treatment_treatment(tenant_id);