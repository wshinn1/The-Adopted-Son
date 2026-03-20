-- Add MoreInfo section template
-- First delete if exists, then insert fresh
DELETE FROM section_templates WHERE component_name = 'MoreInfo';

INSERT INTO section_templates (name, description, component_name, default_data, schema)
VALUES (
  'More Info',
  'Two-column layout with image and text. Image can be positioned on left or right.',
  'MoreInfo',
  '{
    "heading": "About Me",
    "content": "Enter your content here. You can write multiple paragraphs by adding blank lines between them.",
    "image_url": "",
    "image_alt": "Image description",
    "image_position": "left",
    "background_color": "#ffffff",
    "text_color": "#1a1a1a"
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "heading": { "type": "string", "title": "Heading" },
      "content": { "type": "string", "title": "Content" },
      "image_url": { "type": "string", "title": "Image" },
      "image_alt": { "type": "string", "title": "Image Alt Text" },
      "image_position": { "type": "string", "title": "Image Position", "enum": ["left", "right"] },
      "background_color": { "type": "string", "title": "Background Color" },
      "text_color": { "type": "string", "title": "Text Color" }
    }
  }'::jsonb
);
