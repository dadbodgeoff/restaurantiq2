-- RestaurantIQ Database Initialization Script
-- This script runs when the PostgreSQL container starts for the first time

-- Create a message to confirm initialization
DO $$
BEGIN
    RAISE NOTICE 'RestaurantIQ Database initialization starting...';
END
$$;

-- Verify connection
SELECT version() as postgresql_version;

-- Create a simple status table for health checks
CREATE TABLE IF NOT EXISTS system_status (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'healthy',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial status record
INSERT INTO system_status (status, message)
VALUES ('healthy', 'RestaurantIQ database initialized successfully')
ON CONFLICT DO NOTHING;

-- Create a function to update status
CREATE OR REPLACE FUNCTION update_system_status(
    new_status VARCHAR(50),
    new_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE system_status
    SET status = new_status,
        message = COALESCE(new_message, message),
        updated_at = NOW()
    WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the restaurantiq user
GRANT ALL PRIVILEGES ON DATABASE restaurantiq TO restaurantiq;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO restaurantiq;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO restaurantiq;

-- Final confirmation
DO $$
BEGIN
    RAISE NOTICE 'RestaurantIQ Database initialization completed successfully!';
    RAISE NOTICE 'Database is ready for RestaurantIQ application.';
END
$$;
