-- Update Home1 section template schema and default data to include stroke settings

UPDATE section_templates
SET 
  default_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        default_data,
        '{card_stroke_enabled}',
        'false'::jsonb
      ),
      '{card_stroke_width}',
      '"0.5"'::jsonb
    ),
    '{card_stroke_color}',
    '"#E5E5E5"'::jsonb
  ),
  schema = jsonb_set(
    schema,
    '{properties}',
    (schema->'properties') || '{
      "card_stroke_enabled": {
        "type": "boolean",
        "title": "Card Border Enabled"
      },
      "card_stroke_width": {
        "type": "number",
        "title": "Card Border Width",
        "minimum": 0,
        "maximum": 5,
        "step": 0.1
      },
      "card_stroke_color": {
        "type": "string",
        "title": "Card Border Color"
      }
    }'::jsonb
  )
WHERE component_name = 'Home1';
