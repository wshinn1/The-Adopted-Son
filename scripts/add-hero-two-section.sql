-- Add HeroTwo section template
DELETE FROM section_templates WHERE component_name = 'HeroTwo';

INSERT INTO section_templates (name, description, component_name, default_data, schema)
VALUES (
  'Hero Two',
  'Clean minimal hero section with configurable background (image, solid color, or gradient), headline, subheadline, CTA button, and trust text.',
  'HeroTwo',
  '{
    "headline": "Before you finish turning around, the Father is already running toward you.",
    "subheadline": "Daily devotionals to draw you deeper into your identity as a child of God.",
    "show_subheadline": true,
    "button_text": "Read Devotionals",
    "button_url": "/devotionals",
    "show_button": true,
    "trust_text": "Free to read · No account required",
    "show_trust_text": true,
    "background_type": "gradient",
    "background_image_url": "",
    "background_color": "#1a1a2e",
    "gradient_from": "#1a1a2e",
    "gradient_to": "#2B4A6F",
    "gradient_direction": "to-br",
    "overlay_opacity": 0.4,
    "text_color": "#ffffff",
    "button_bg_color": "#ffffff",
    "button_text_color": "#1a1a1a",
    "min_height": "70vh",
    "content_width": "medium",
    "text_align": "center"
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "headline": { "type": "string", "title": "Headline" },
      "subheadline": { "type": "string", "title": "Subheadline" },
      "show_subheadline": { "type": "boolean", "title": "Show Subheadline" },
      "button_text": { "type": "string", "title": "Button Text" },
      "button_url": { "type": "string", "title": "Button URL" },
      "show_button": { "type": "boolean", "title": "Show Button" },
      "trust_text": { "type": "string", "title": "Trust Text" },
      "show_trust_text": { "type": "boolean", "title": "Show Trust Text" },
      "background_type": { "type": "string", "title": "Background Type", "enum": ["gradient", "color", "image"] },
      "background_image_url": { "type": "string", "title": "Background Image URL" },
      "background_color": { "type": "string", "title": "Background Color" },
      "gradient_from": { "type": "string", "title": "Gradient From" },
      "gradient_to": { "type": "string", "title": "Gradient To" },
      "gradient_direction": { "type": "string", "title": "Gradient Direction", "enum": ["to-r", "to-br", "to-b", "to-bl", "to-tr"] },
      "overlay_opacity": { "type": "number", "title": "Overlay Opacity", "minimum": 0, "maximum": 1 },
      "text_color": { "type": "string", "title": "Text Color" },
      "button_bg_color": { "type": "string", "title": "Button Background Color" },
      "button_text_color": { "type": "string", "title": "Button Text Color" },
      "min_height": { "type": "string", "title": "Minimum Height" },
      "content_width": { "type": "string", "title": "Content Width", "enum": ["narrow", "medium", "wide", "full"] },
      "text_align": { "type": "string", "title": "Text Alignment", "enum": ["left", "center", "right"] }
    }
  }'::jsonb
);
