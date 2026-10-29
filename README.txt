VCC SITE UPDATE - copy these into S:\chris\church-site\ (choose "Replace")

BEFORE copying: run the SQL from chat (renames SERVICES -> SERIES).

DELETE these old files after copying:
  functions/api/services.ts
  functions/api/admin/services.ts
  src/editors/service_editor.tsx
  functions/api/keydebug.ts   (if still there)

Then:  npm run build   -> restart Wrangler -> test -> git add . / commit / push
