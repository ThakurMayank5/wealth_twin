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
    120000.00,
    65000.00,
    345000.00,
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

-- Sample transactions (Rich data)
INSERT INTO transactions (id, user_id, amount, type, category, merchant, description, timestamp, running_balance, source) VALUES
('f0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 120000.00, 'CREDIT', 'SALARY', 'TechCorp India', 'Monthly salary - March', NOW() - interval '2 days', 345000.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 25000.00, 'DEBIT', 'RENT', 'Ramesh Landlord', 'Monthly rent', NOW() - interval '3 days', 225000.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4500.00, 'DEBIT', 'GROCERIES', 'BlinkIt', 'Weekly groceries', NOW() - interval '4 days', 250000.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1850.00, 'DEBIT', 'FOOD', 'Swiggy', 'Dinner delivery', NOW() - interval '5 days', 254500.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 15000.00, 'DEBIT', 'INVESTMENT', 'SIP Auto-debit', 'HDFC Mid Cap Fund SIP', NOW() - interval '6 days', 256350.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3200.00, 'DEBIT', 'UTILITIES', 'BESCOM', 'Electricity bill', NOW() - interval '8 days', 271350.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 12500.00, 'DEBIT', 'SHOPPING', 'Amazon', 'New Monitor', NOW() - interval '9 days', 274550.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 450.00, 'DEBIT', 'TRANSPORT', 'Uber', 'Office commute', NOW() - interval '10 days', 287050.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 10000.00, 'DEBIT', 'INVESTMENT', 'SIP Auto-debit', 'Axis Bluechip Fund SIP', NOW() - interval '12 days', 287500.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6500.00, 'DEBIT', 'FOOD', 'Zomato', 'Weekend Dinner', NOW() - interval '14 days', 297500.00, 'CORE_BANKING'),
('f0000001-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1500.00, 'CREDIT', 'TRANSFER', 'Rahul Sharma', 'Dinner split', NOW() - interval '15 days', 304000.00, 'UPI'),
('f0000001-0000-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 899.00, 'DEBIT', 'ENTERTAINMENT', 'Netflix', 'Monthly Subscription', NOW() - interval '16 days', 302500.00, 'CREDIT_CARD'),
('f0000001-0000-0000-0000-000000000013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5000.00, 'DEBIT', 'HEALTH', 'Apollo Pharmacy', 'Medical Supplies', NOW() - interval '18 days', 303399.00, 'UPI'),
('f0000001-0000-0000-0000-000000000014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2200.00, 'DEBIT', 'TRANSPORT', 'Indian Oil', 'Fuel', NOW() - interval '20 days', 308399.00, 'CREDIT_CARD'),
('f0000001-0000-0000-0000-000000000015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 35000.00, 'DEBIT', 'INVESTMENT', 'Zerodha', 'Stock Purchase', NOW() - interval '25 days', 310599.00, 'CORE_BANKING')
ON CONFLICT (id) DO NOTHING;

-- Sample goals
INSERT INTO goals (id, user_id, name, goal_type, target_amount, current_amount, target_date, monthly_contribution, status) VALUES
('e0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Emergency Fund', 'EMERGENCY', 500000.00, 320000.00, '2026-12-31', 15000.00, 'ACTIVE'),
('e0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Europe Trip 2027', 'TRAVEL', 400000.00, 150000.00, '2027-06-30', 20000.00, 'ACTIVE'),
('e0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Dream Home Downpayment', 'HOME', 2500000.00, 800000.00, '2029-03-31', 45000.00, 'ACTIVE'),
('e0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'New SUV', 'VEHICLE', 1800000.00, 450000.00, '2028-10-31', 25000.00, 'ACTIVE'),
('e0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Early Retirement', 'RETIREMENT', 10000000.00, 1200000.00, '2040-01-01', 50000.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Sample SIP mandates
INSERT INTO sip_mandates (id, user_id, fund_id, fund_name, amount, frequency, status, start_date, next_due_date, is_first_time_fund) VALUES
('d0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'HDFC-MID-001', 'HDFC Mid Cap Opportunities Fund', 15000.00, 'MONTHLY', 'ACTIVE', '2024-01-01', '2026-05-01', false),
('d0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'AXIS-BLUE-001', 'Axis Bluechip Fund', 10000.00, 'MONTHLY', 'ACTIVE', '2023-06-01', '2026-05-05', false),
('d0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'PPFAS-FLX-001', 'Parag Parikh Flexi Cap Fund', 12500.00, 'MONTHLY', 'ACTIVE', '2023-09-01', '2026-05-10', false),
('d0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SBI-SML-001', 'SBI Small Cap Fund', 5000.00, 'MONTHLY', 'ACTIVE', '2025-01-01', '2026-05-15', true)
ON CONFLICT (id) DO NOTHING;

-- Sample assets
INSERT INTO assets (id, user_id, asset_type, name, current_value, purchase_value, purchase_date, metadata) VALUES
('c0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MUTUAL_FUND', 'HDFC Mid Cap Fund', 380000.00, 240000.00, '2024-01-15', '{"folio": "12345678"}'),
('c0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MUTUAL_FUND', 'Axis Bluechip Fund', 450000.00, 360000.00, '2023-06-01', '{"folio": "87654321"}'),
('c0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MUTUAL_FUND', 'PPFAS Flexi Cap', 520000.00, 410000.00, '2023-09-01', '{"folio": "56781234"}'),
('c0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'FIXED_DEPOSIT', 'SBI FD 7.1%', 500000.00, 500000.00, '2025-03-01', '{"rate": "7.1%", "maturity": "2026-03-01"}'),
('c0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'STOCK', 'Reliance Industries', 250000.00, 180000.00, '2023-11-15', '{"quantity": 85, "avg_price": "2117.64"}'),
('c0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'GOLD', 'Digital Gold', 125000.00, 95000.00, '2023-10-20', '{"grams": 16.5}')
ON CONFLICT (id) DO NOTHING;

-- Sample Risk Events
INSERT INTO risk_events (id, user_id, action_type, risk_score, signals, decision, resolved, created_at) VALUES
('b0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'LARGE_TRANSFER', 85, '{"geo_velocity": "high", "amount": 250000}', 'BLOCK', true, NOW() - interval '45 days'),
('b0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'LOGIN', 65, '{"new_device": true, "location": "unknown"}', 'CHALLENGE', true, NOW() - interval '10 days')
ON CONFLICT (id) DO NOTHING;
