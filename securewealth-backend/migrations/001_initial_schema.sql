CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    kyc_status TEXT DEFAULT 'PENDING',
    risk_appetite TEXT DEFAULT 'MODERATE',
    avg_monthly_income NUMERIC(15,2) DEFAULT 0,
    avg_monthly_spend NUMERIC(15,2) DEFAULT 0,
    account_balance NUMERIC(15,2) DEFAULT 0,
    consent_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    device_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    is_trusted BOOLEAN DEFAULT FALSE,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, device_hash)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    category TEXT,
    merchant TEXT,
    description TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    running_balance NUMERIC(15,2),
    source TEXT DEFAULT 'CORE_BANKING'
);

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    goal_type TEXT NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) DEFAULT 0,
    target_date DATE NOT NULL,
    monthly_contribution NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sip_mandates (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    fund_id TEXT NOT NULL,
    fund_name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    frequency TEXT DEFAULT 'MONTHLY',
    status TEXT DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    next_due_date DATE,
    is_first_time_fund BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    asset_type TEXT NOT NULL,
    name TEXT NOT NULL,
    current_value NUMERIC(15,2) NOT NULL,
    purchase_value NUMERIC(15,2),
    purchase_date DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wealth_actions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action_type TEXT NOT NULL,
    action_payload JSONB NOT NULL,
    risk_score INT,
    risk_level TEXT,
    decision TEXT,
    device_hash TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action_type TEXT,
    risk_score INT,
    signals JSONB,
    decision TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp ON transactions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_sip_mandates_user_status ON sip_mandates(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wealth_actions_user_created ON wealth_actions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_user_device_hash ON devices(user_id, device_hash);
