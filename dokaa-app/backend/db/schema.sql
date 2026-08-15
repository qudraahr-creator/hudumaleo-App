-- ============================================
-- DOKAA MVP DATABASE SCHEMA (PostgreSQL)
-- Phase 1: Dar es Salaam launch
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (customers + providers share this table; role separates them)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'provider', 'admin')),
    profile_photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CATEGORIES (Umeme, Plumbing, Cleaning, Mechanic, Appliance repair)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SERVICES (specific services under a category)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PROVIDERS (extra profile info for users with role='provider')
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    experience_years INT DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_doc_url TEXT,
    avg_rating NUMERIC(2,1) DEFAULT 0.0,
    total_reviews INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PROVIDER_SERVICES (many-to-many: which services a provider offers + price)
CREATE TABLE provider_services (
    id SERIAL PRIMARY KEY,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    price_min NUMERIC(10,2),
    price_max NUMERIC(10,2),
    UNIQUE(provider_id, service_id)
);

-- LOCATIONS (provider service area / current location, and customer address)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100),           -- e.g. "Home", "Service area"
    address TEXT,
    ward VARCHAR(100),            -- e.g. Kinondoni, Ilala, Temeke
    city VARCHAR(100) DEFAULT 'Dar es Salaam',
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    radius_km NUMERIC(5,2) DEFAULT 5.0,  -- how far a provider is willing to travel
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- BOOKING_STATUS lookup (kept as its own table for clarity/reporting)
CREATE TABLE booking_status (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    label VARCHAR(50) NOT NULL
);

INSERT INTO booking_status (code, label) VALUES
    ('pending', 'Pending'),
    ('accepted', 'Accepted'),
    ('rejected', 'Rejected'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled');

-- BOOKINGS
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id),
    status_code VARCHAR(20) DEFAULT 'pending' REFERENCES booking_status(code),
    scheduled_at TIMESTAMP,
    location_id INT REFERENCES locations(id),
    notes TEXT,
    price_agreed NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- MESSAGES (simple chat between customer and provider on a booking)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    method VARCHAR(30) DEFAULT 'mpesa', -- mpesa, mixx, airtel, cash
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150),
    body TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default categories (Phase 1)
INSERT INTO categories (name, icon) VALUES
    ('Umeme', 'flash-outline'),
    ('Plumbing', 'water-outline'),
    ('Cleaning', 'sparkles-outline'),
    ('Mechanic', 'car-outline'),
    ('Appliance Repair', 'construct-outline');

-- Helpful indexes
CREATE INDEX idx_locations_lat_lng ON locations (latitude, longitude);
CREATE INDEX idx_bookings_status ON bookings (status_code);
CREATE INDEX idx_bookings_provider ON bookings (provider_id);
CREATE INDEX idx_bookings_customer ON bookings (customer_id);
