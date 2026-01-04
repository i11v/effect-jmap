# Effect JMAP Library - Project Rules

## Package Management
- Always use pnpm as the package manager (never npm, yarn, or bun)
- Use pnpm for all script execution (e.g., `pnpm build`, `pnpm test`, `pnpm typecheck`)
- Use `pnpm dlx` instead of `npx` for running one-off commands (e.g., `pnpm dlx vitest` not `npx vitest`)

## Commit Messages
- Include only meaningful information about the changes
- Do not include "Generated with" banners, co-author attributions, or similar boilerplate
