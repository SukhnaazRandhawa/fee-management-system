-- Accountability trail: track which user recorded each payment.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS recorded_by INTEGER REFERENCES users(id);

-- Void support: corrections are void + re-enter, never edit/delete in place.
-- A payment is considered voided when voided_at IS NOT NULL.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS voided_by INTEGER REFERENCES users(id);
