-- Add default newsletter settings to site_settings table
INSERT INTO site_settings (key, value) 
VALUES (
  'newsletter_settings', 
  '{"heading":"Stay Connected","subheading":"Get the latest devotionals and updates delivered to your inbox.","button_text":"Subscribe","background_color":"#F5F2ED","text_color":"#1a1a1a"}'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
