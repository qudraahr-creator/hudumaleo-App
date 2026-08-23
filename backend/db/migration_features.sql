ALTER TABLE providers ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS working_hours_start TIME;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS working_hours_end TIME;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS working_days VARCHAR(50) DEFAULT 'Mon-Sat';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
