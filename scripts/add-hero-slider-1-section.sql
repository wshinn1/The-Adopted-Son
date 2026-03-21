-- Add HeroSlider1 section template
DELETE FROM section_templates WHERE component_name = 'HeroSlider1';

INSERT INTO section_templates (name, description, component_name, default_data, schema)
VALUES (
  'Hero Slider 1',
  'Full-screen hero with rotating daily headlines and crossfading background images. Features edge blur effect.',
  'HeroSlider1',
  '{
    "headlines": ["Welcome to Our Site", "Discover Something New", "Join Our Community"],
    "show_subtitle": false,
    "subtitle": "",
    "background_images": [],
    "text_color": "#ffffff",
    "overlay_opacity": 0.3,
    "image_transition_speed": 8
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "headlines": { 
        "type": "array", 
        "title": "Headlines (rotates daily at 12:30 AM EST)", 
        "items": { "type": "string" },
        "maxItems": 20
      },
      "show_subtitle": { "type": "boolean", "title": "Show Subtitle" },
      "subtitle": { "type": "string", "title": "Subtitle" },
      "background_images": { 
        "type": "array", 
        "title": "Background Images (crossfades between up to 5)", 
        "items": { "type": "string" },
        "maxItems": 5
      },
      "text_color": { "type": "string", "title": "Text Color" },
      "overlay_opacity": { "type": "number", "title": "Overlay Darkness (0-1)", "minimum": 0, "maximum": 1 },
      "image_transition_speed": { "type": "number", "title": "Image Transition Speed (seconds)" }
    }
  }'::jsonb
);
