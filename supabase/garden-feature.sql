-- Garden Feature Migration
-- Run this in the Supabase SQL Editor

-- 1. Add points to user_profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'points') THEN
        ALTER TABLE user_profiles ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Create Items table (Seeds)
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  growth_duration_hours INTEGER NOT NULL,
  image_asset TEXT, -- Path to local asset or URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  item_id UUID REFERENCES items NOT NULL,
  quantity INTEGER DEFAULT 1,
  UNIQUE(user_id, item_id)
);

-- 4. Create Garden Plants table
CREATE TABLE IF NOT EXISTS garden_plants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  item_id UUID REFERENCES items NOT NULL,
  planted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  box_index INTEGER NOT NULL, -- Position in the garden grid (0-5)
  UNIQUE(user_id, box_index)
);

-- 5. Seed some initial items
INSERT INTO items (name, description, cost, growth_duration_hours, image_asset)
VALUES
  ('Lavender', 'A calming purple flower.', 10, 24, 'lavender'),
  ('Sunflower', 'Bright and cheerful.', 30, 48, 'sunflower'),
  ('Rose', 'Classic beauty.', 50, 72, 'rose'),
  ('Oak Tree', 'Strong and steady.', 100, 168, 'oak_tree')
ON CONFLICT DO NOTHING;

-- 6. Enable RLS (Row Level Security)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_plants ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies
-- Items are readable by everyone
CREATE POLICY "Items are public" ON items FOR SELECT USING (true);

-- Inventory is private to the user
CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON user_inventory FOR ALL USING (auth.uid() = user_id);

-- Garden plants are private to the user
CREATE POLICY "Users can view own garden" ON garden_plants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own garden" ON garden_plants FOR ALL USING (auth.uid() = user_id);
