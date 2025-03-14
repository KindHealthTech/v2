-- Seed data for test patients in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    phone,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) (
    SELECT
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        '91' || LPAD(CAST((ROW_NUMBER() OVER ()) + 9876543200 AS TEXT), 10, '0'), 
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        current_timestamp,
        '{"provider":"phone","providers":["phone"]}',
        '{}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    FROM generate_series(1, 10)
);

-- Insert corresponding entries in public.users with patient role
INSERT INTO public.users (id, phone_number, role)
SELECT 
    id,
    phone,
    'patient'::user_role
FROM auth.users
WHERE phone LIKE '91987654%'
AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.users.id
);

-- Insert sample patient profiles with Indian names
INSERT INTO public.patient_profiles (id, full_name, date_of_birth, gender, blood_group, allergies)
SELECT 
    u.id,
    (ARRAY[
        'Aarav Kumar',
        'Priya Patel',
        'Arjun Singh',
        'Zara Khan',
        'Vihaan Sharma',
        'Anaya Reddy',
        'Advait Verma',
        'Aisha Kapoor',
        'Reyansh Malhotra',
        'Myra Gupta'
    ])[ROW_NUMBER() OVER (ORDER BY u.created_at)],
    '1990-01-01'::DATE + (random() * 10000)::INTEGER * INTERVAL '1 day',
    CASE WHEN random() > 0.5 THEN 'Male' ELSE 'Female' END,
    (ARRAY['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])[floor(random() * 8 + 1)],
    CASE WHEN random() > 0.7 
        THEN ARRAY['Peanuts', 'Penicillin', 'Dust', 'Pollen']
        ELSE ARRAY[]::TEXT[]
    END
FROM public.users u
WHERE u.role = 'patient'
AND NOT EXISTS (
    SELECT 1 FROM public.patient_profiles WHERE patient_profiles.id = u.id
);

-- Seed data for test doctors in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    phone,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) (
    SELECT
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        '415212' || LPAD(CAST((ROW_NUMBER() OVER ()) + 7777 AS TEXT), 4, '0'), 
        crypt('doctor123', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        current_timestamp,
        '{"provider":"phone","providers":["phone"]}',
        '{}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    FROM generate_series(1, 5)
);

-- Insert corresponding entries in public.users with doctor role
INSERT INTO public.users (id, phone_number, role)
SELECT 
    id,
    phone,
    'doctor'::user_role
FROM auth.users
WHERE phone LIKE '415212%'
AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.users.id
);

-- Insert sample doctor profiles with American names
INSERT INTO public.doctor_profiles (id, full_name, specialization, years_of_experience, qualification, hospital_affiliation, is_profile_complete)
SELECT 
    u.id,
    (ARRAY[
        'Dr. Sarah Williams',
        'Dr. Michael Chen',
        'Dr. James Rodriguez',
        'Dr. Emily Patel',
        'Dr. David Washington'
    ])[ROW_NUMBER() OVER (ORDER BY u.created_at)],
    (ARRAY[
        'Cardiology',
        'Neurology',
        'Orthopedics',
        'Pediatrics',
        'Dermatology'
    ])[ROW_NUMBER() OVER (ORDER BY u.created_at)],
    5 + (random() * 15)::INTEGER,
    (ARRAY[
        'MD, FACC',
        'MD, PhD, FAAN',
        'MD, FAAOS',
        'MD, FAAP',
        'MD, FAAD'
    ])[ROW_NUMBER() OVER (ORDER BY u.created_at)],
    (ARRAY[
        'San Francisco General Hospital',
        'Stanford Medical Center',
        'UCSF Medical Center',
        'California Pacific Medical Center',
        'Kaiser Permanente San Francisco'
    ])[ROW_NUMBER() OVER (ORDER BY u.created_at)],
    true
FROM public.users u
WHERE u.role = 'doctor'
AND NOT EXISTS (
    SELECT 1 FROM public.doctor_profiles WHERE doctor_profiles.id = u.id
);