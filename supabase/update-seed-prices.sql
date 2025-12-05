-- Update seed prices to make them more accessible for new users
-- Run this in the Supabase SQL Editor

UPDATE items SET cost = 10 WHERE name = 'Lavender';
UPDATE items SET cost = 30 WHERE name = 'Sunflower';
UPDATE items SET cost = 50 WHERE name = 'Rose';
UPDATE items SET cost = 100 WHERE name = 'Oak Tree';

-- Verify the updates
SELECT name, cost FROM items ORDER BY cost;
