-- =====================================================
--  COMMUNICATION MANAGEMENT SYSTEM
-- =====================================================

-- Contact method enumeration
CREATE TYPE contact_method_enum AS ENUM ('email', 'sms', 'whatsapp', 'none');

-- Notification frequency enumeration
CREATE TYPE notification_frequency_enum AS ENUM ('immediate', 'daily', 'weekly', 'never');

-- User communication and notification preferences
CREATE TABLE user_communication_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification channel preferences
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    whatsapp_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    in_app_notifications BOOLEAN DEFAULT true,
    
    -- Communication preferences
    preferred_contact_method contact_method_enum DEFAULT 'email',
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Notification frequency settings
    notification_frequency notification_frequency_enum DEFAULT 'immediate',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
--  INDEXES FOR PERFORMANCE
-- =====================================================

-- Communication preferences indexes
CREATE INDEX idx_user_communication_preferences_user_id ON user_communication_preferences(user_id);
CREATE INDEX idx_user_communication_preferences_notification_frequency ON user_communication_preferences(notification_frequency);

-- =====================================================
--  TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Function to update updated_at timestamp (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to communication preferences
CREATE TRIGGER update_user_communication_preferences_updated_at BEFORE UPDATE ON user_communication_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
--  VIEWS FOR COMMON QUERIES
-- =====================================================

-- Users with communication preferences
CREATE VIEW users_with_communication_preferences AS
SELECT 
    u.*,
    up.first_name,
    up.last_name,
    up.profile_type,
    ucp.email_notifications,
    ucp.sms_notifications,
    ucp.whatsapp_notifications,
    ucp.push_notifications,
    ucp.in_app_notifications,
    ucp.preferred_contact_method,
    ucp.preferred_language,
    ucp.timezone,
    ucp.notification_frequency,
    ucp.quiet_hours_start,
    ucp.quiet_hours_end
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_communication_preferences ucp ON u.id = ucp.user_id
WHERE u.is_active = true AND u.deleted_at IS NULL;

-- =====================================================
--  COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_communication_preferences IS 'User notification and communication preferences';
COMMENT ON COLUMN user_communication_preferences.preferred_contact_method IS 'User preferred method for receiving communications';
COMMENT ON COLUMN user_communication_preferences.notification_frequency IS 'How often user wants to receive notifications';
COMMENT ON COLUMN user_communication_preferences.quiet_hours_start IS 'Start time for quiet hours (no notifications)';
COMMENT ON COLUMN user_communication_preferences.quiet_hours_end IS 'End time for quiet hours (no notifications)';
