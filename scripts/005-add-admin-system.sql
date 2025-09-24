-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert default admin user (you can change these details)
INSERT INTO users (name, email, password_hash, role, auth_provider, created_at)
VALUES (
  'Admin User',
  'admin@hdnotes.com',
  '$2a$12$LQv3c1yqBwEHxv03kpOOHu.Kj.1VklmVwBhWQ4iAqYMZCO/PUixgO', -- password: admin123
  'admin',
  'email',
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  password_hash = '$2a$12$LQv3c1yqBwEHxv03kpOOHu.Kj.1VklmVwBhWQ4iAqYMZCO/PUixgO';

-- Update existing users to have 'user' role if null
UPDATE users SET role = 'user' WHERE role IS NULL;
