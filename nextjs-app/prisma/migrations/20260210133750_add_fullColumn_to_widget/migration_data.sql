-- Migrate fullColumn from config JSON to field
-- Esta query actualiza el campo fullColumn basado en el valor en config.fullColumn
-- Si config.fullColumn es true y el widget no tiene fullColumn en 1, lo actualiza
UPDATE "Widget"
SET "fullColumn" = ((config->>'fullColumn')::boolean)
WHERE config ? 'fullColumn'
  AND ((config->>'fullColumn')::boolean) != "fullColumn";

-- Alternativamente, si quieres ser más conservador:
-- UPDATE "Widget"
-- SET "fullColumn" = true
-- WHERE config ? 'fullColumn'
--   AND (config->>'fullColumn')::boolean = true
--   AND "fullColumn" = false;
