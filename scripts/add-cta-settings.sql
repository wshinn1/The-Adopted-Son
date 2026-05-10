-- Insert default CTA settings into site_settings table
-- Run this in the Supabase SQL editor

INSERT INTO site_settings (key, value)
VALUES (
  'cta_settings',
  '{"headline":"Support This Ministry","subtext":"Your generosity helps us create daily devotionals and reach more people.","button_text":"Give Today","button_url":"/give","bg_color":"#1a1a2e","text_color":"#ffffff","subtext_color":"rgba(255,255,255,0.6)","button_bg_color":"#ffffff","button_text_color":"#1a1a2e","button_hover_bg_color":"#f0f0f0","show_icon":true,"icon_color":"rgba(255,255,255,0.7)","full_width":false,"enabled_on_devotionals":false}'
)
ON CONFLICT (key) DO NOTHING;
