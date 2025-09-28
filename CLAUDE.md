# Effect JMAP Library - Project Rules

## Package Management
- Always use pnpm as the package manager (never npm, yarn, or bun)
- Use pnpm for all script execution (e.g., `pnpm build`, `pnpm test`, `pnpm typecheck`)

## TypeScript Execution
- When running TypeScript files directly with node, use the tsx import loader
- Always include the env-file argument for environment variables
- Format: `node --env-file=.env.dev --import=tsx/esm filename.ts`
- Example: `node --env-file=.env.dev --import=tsx/esm get-latest-mail.local.ts`

## Code Search
- You run in an environment where ast-grep (`sg`) is available
- Whenever a search requires syntax-aware or structural matching, default to:
  - `sg --lang rust -p '''` (or set `--lang` appropriately)
- Avoid falling back to text-only tools like `rg` or `grep` unless explicitly requested as a plain-text search
