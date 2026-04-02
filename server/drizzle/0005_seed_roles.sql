INSERT INTO "roles" ("name", "description")
SELECT 'ADMIN', 'Administrative role with elevated access'
WHERE NOT EXISTS (
  SELECT 1
  FROM "roles"
  WHERE "name" = 'ADMIN'
);
--> statement-breakpoint
INSERT INTO "roles" ("name", "description")
SELECT 'USER', 'Default role for standard users'
WHERE NOT EXISTS (
  SELECT 1
  FROM "roles"
  WHERE "name" = 'USER'
);
--> statement-breakpoint
INSERT INTO "roles" ("name", "description")
SELECT 'PROVIDER', 'Service provider account'
WHERE NOT EXISTS (
  SELECT 1
  FROM "roles"
  WHERE "name" = 'PROVIDER'
);
