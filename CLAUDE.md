# Effect JMAP Library - Project Rules

## Package Management
- Always use pnpm as the package manager (never npm, yarn, or bun)
- Use pnpm for all script execution (e.g., `pnpm build`, `pnpm test`, `pnpm typecheck`)

## TypeScript Execution
- When running TypeScript files directly with node, use the tsx import loader
- Always include the env-file argument for environment variables
- Format: `node --env-file=.env.dev --import=tsx/esm filename.ts`
- Example: `node --env-file=.env.dev --import=tsx/esm get-latest-mail.local.ts`
