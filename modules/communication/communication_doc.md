# Communication Management Module

## Overview
Handles user communication preferences and notification settings. Extracted from user management for better modularity.

## Schema

### Tables
- **`user_communication_preferences`** - User notification and communication preferences
  - Notification channels: email, SMS, WhatsApp, push, in-app
  - Preferences: contact method, language, timezone, frequency
  - Quiet hours support

### Views
- **`users_with_communication_preferences`** - Combined user data with communication settings
