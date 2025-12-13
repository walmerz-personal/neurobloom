-- Kitten Feature Migration
-- Run this in the Supabase SQL Editor

-- 1. Add type column to items table to distinguish pets from seeds
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'type') THEN
        ALTER TABLE items ADD COLUMN type TEXT DEFAULT 'seed';
    END IF;
END $$;

-- 2. Create garden_pets table (one pet per user)
CREATE TABLE IF NOT EXISTS garden_pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  item_id UUID REFERENCES items NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE garden_pets ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for garden_pets
CREATE POLICY "Users can view own pet" ON garden_pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pet" ON garden_pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pet" ON garden_pets FOR DELETE USING (auth.uid() = user_id);

-- 5. Insert the kitten item (50 points, 168 hours = 7 days to grow)
INSERT INTO items (name, description, cost, growth_duration_hours, image_asset, type)
VALUES ('Kitten', 'A playful gray and black kitten that grows into a cat over a week.', 50, 168, 'kitten', 'pet')
ON CONFLICT DO NOTHING;

-- Verify
SELECT name, cost, type, growth_duration_hours FROM items;
