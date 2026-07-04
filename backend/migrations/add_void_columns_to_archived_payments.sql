-- Preserve void status when payments are archived at year-end rollover,
-- so voided payments in a rolled-over year aren't stripped of their history.
ALTER TABLE archived_payments ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE archived_payments ADD COLUMN IF NOT EXISTS voided_by INTEGER REFERENCES users(id);
