-- Diagrammer Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'OWNER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_key AS ENUM ('free', 'pro', 'team');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON "User"(createdAt);
CREATE INDEX IF NOT EXISTS idx_billing_profile_user_id ON "BillingProfile"(userId);
CREATE INDEX IF NOT EXISTS idx_billing_profile_stripe_customer_id ON "BillingProfile"(stripeCustomerId) WHERE stripeCustomerId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organization_created_at ON "Organization"(createdAt);
CREATE INDEX IF NOT EXISTS idx_org_member_user_id ON "OrgMember"(userId);
CREATE INDEX IF NOT EXISTS idx_org_member_organization_id ON "OrgMember"(organizationId);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON "AuditLog"(userId);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON "AuditLog"(createdAt);
CREATE INDEX IF NOT EXISTS idx_feature_flag_key ON "FeatureFlag"(key);

-- Insert default feature flags
INSERT INTO "FeatureFlag" (key, name, description, enabled, rollout, createdAt, updatedAt)
VALUES 
    ('new_dashboard', 'New Dashboard', '새로운 대시보드 UI', false, 0, NOW(), NOW()),
    ('ai_enhancements', 'AI Enhancements', 'AI 기능 개선', true, 100, NOW(), NOW()),
    ('team_collaboration', 'Team Collaboration', '팀 협업 기능', true, 50, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Insert default admin user (for development)
INSERT INTO "User" (id, email, name, role, status, createdAt, updatedAt)
VALUES 
    ('admin-user-123', 'admin@diagrammer.realstory.blog', 'Admin User', 'OWNER', 'ACTIVE', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
