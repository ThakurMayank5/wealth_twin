-- Seed data for development/testing
-- Demo user password: "demo1234" (bcrypt hash below)

INSERT INTO users (id, email, phone, full_name, password_hash, kyc_status, risk_appetite, avg_monthly_income, avg_monthly_spend, account_balance, consent_given)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'demo@twinvest.app',
    '+919876543210',
    'Arjun Mehta',
    '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfl7JCxL7GQ3T1x5YOa7rNkSp3W3E8G6',
    'VERIFIED',
    'MODERATE',
    85000.00,
    52000.00,
    245000.00,
    true
) ON CONFLICT (id) DO NOTHING;

-- Trusted device for demo user
INSERT INTO devices (id, user_id, device_hash, user_agent, is_trusted)
VALUES (
    'dddd1111-2222-3333-4444-555566667777',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'demo-device-fingerprint',
    'TwinVest/1.0 Expo',
    true
) ON CONFLICT (user_id, device_hash) DO NOTHING;

-- Sample transactions
INSERT INTO transactions (id, user_id, amount, type, category, merchant, description, timestamp, running_balance, source) VALUES
('t0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 85000.00, 'CREDIT', 'SALARY', 'Employer', 'Monthly salary', NOW() - interval '5 days', 245000.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 15000.00, 'DEBIT', 'RENT', 'Landlord', 'Monthly rent', NOW() - interval '4 days', 230000.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3500.00, 'DEBIT', 'GROCERIES', 'BigBasket', 'Weekly groceries', NOW() - interval '3 days', 226500.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1200.00, 'DEBIT', 'FOOD', 'Swiggy', 'Food delivery', NOW() - interval '2 days', 225300.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5000.00, 'DEBIT', 'INVESTMENT', 'SIP Auto-debit', 'HDFC Mid Cap Fund SIP', NOW() - interval '2 days', 220300.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2500.00, 'DEBIT', 'UTILITIES', 'Electricity Board', 'Electricity bill', NOW() - interval '1 day', 217800.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 8000.00, 'DEBIT', 'SHOPPING', 'Amazon', 'Electronics purchase', NOW() - interval '8 days', 250000.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 600.00, 'DEBIT', 'TRANSPORT', 'Uber', 'Cab rides', NOW() - interval '1 day', 217200.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 10000.00, 'DEBIT', 'INVESTMENT', 'SIP Auto-debit', 'Axis Bluechip Fund SIP', NOW() - interval '10 days', 258000.00, 'CORE_BANKING'),
('t0000001-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4500.00, 'DEBIT', 'FOOD', 'Zomato', 'Dining out', NOW() - interval '12 days', 268000.00, 'CORE_BANKING')
ON CONFLICT (id) DO NOTHING;

-- Sample goals
INSERT INTO goals (id, user_id, name, goal_type, target_amount, current_amount, target_date, monthly_contribution, status) VALUES
('g0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Emergency Fund', 'EMERGENCY', 300000.00, 180000.00, '2026-12-31', 15000.00, 'ACTIVE'),
('g0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Europe Trip', 'TRAVEL', 500000.00, 75000.00, '2027-06-30', 25000.00, 'ACTIVE'),
('g0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'New Car', 'PURCHASE', 1200000.00, 200000.00, '2028-03-31', 40000.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Sample SIP mandates
INSERT INTO sip_mandates (id, user_id, fund_id, fund_name, amount, frequency, status, start_date, next_due_date, is_first_time_fund) VALUES
('s0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'HDFC-MID-001', 'HDFC Mid Cap Opportunities Fund', 5000.00, 'MONTHLY', 'ACTIVE', '2026-01-01', '2026-05-01', false),
('s0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'AXIS-BLUE-001', 'Axis Bluechip Fund', 10000.00, 'MONTHLY', 'ACTIVE', '2025-06-01', '2026-05-01', false),
('s0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'PPFAS-FLX-001', 'Parag Parikh Flexi Cap Fund', 7500.00, 'MONTHLY', 'ACTIVE', '2025-09-01', '2026-05-01', false)
ON CONFLICT (id) DO NOTHING;

-- Sample assets
INSERT INTO assets (id, user_id, asset_type, name, current_value, purchase_value, purchase_date, metadata) VALUES
('a0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MUTUAL_FUND', 'HDFC Mid Cap Fund', 125000.00, 100000.00, '2025-01-15', '{"folio": "12345678"}'),
('a0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MUTUAL_FUND', 'Axis Bluechip Fund', 280000.00, 240000.00, '2024-06-01', '{"folio": "87654321"}'),
('a0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'FIXED_DEPOSIT', 'SBI FD 7.1%', 500000.00, 500000.00, '2025-03-01', '{"rate": "7.1%", "maturity": "2026-03-01"}'),
('a0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'GOLD', 'Digital Gold', 85000.00, 70000.00, '2025-08-01', '{"grams": 12.5}')
ON CONFLICT (id) DO NOTHING;
