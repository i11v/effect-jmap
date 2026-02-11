# Effect JMAP - Project Rules

A TypeScript library implementing RFC 8621 JMAP for Mail using Effect-TS.

## Package Management

- Always use pnpm as the package manager (never npm, yarn, or bun)
- Use `pnpm dlx` instead of `npx` for one-off commands

## Effect-TS Patterns

1. **Services via Context.Tag**: Services are defined using `Context.Tag`
2. **Layers for dependency injection**: Services are provided via `Layer`
3. **Effect.gen vs Effect.flatMap/pipe**:
   - Use `Effect.gen(function* () { ... })` for complex flows with intermediate values or multiple steps
   - Use `Effect.flatMap` / `.pipe()` for simple one-step service calls (e.g., `Effect.flatMap(Service, svc => svc.method(args))`)
4. **Schema validation**: Effect Schema for type-safe parsing
5. **Branded types**: Use `Schema.brand()` for type safety (e.g., `Id`, `State`)

## Code Style

- ES modules with `.js` extensions in imports (for Node ESM compatibility)
- Errors use `Data.TaggedError` pattern

## Git Workflow

- **Never push directly to main** - Always use feature branches and pull requests
- Create a branch for your changes: `git checkout -b feature/description`
- Push the branch and create a PR via `gh pr create`
- Wait for CI checks and review before merging

## Commit Messages

- **Sentence-case** subjects: `fix: Correct the return type` (not `fix: correct...`)
- No "Generated with" banners or co-author attributions

## Publishing

- Both release and preview publishing live in `publish.yml` to share a single npm OIDC trusted publisher
- Release (push to main): uses `semantic-release` with OIDC token exchange
- Preview (pull requests): publishes `0.0.0-pr.<number>.<sha>` versions via `npm publish --provenance` with OIDC
- Do not create separate publishing workflow files — npm only allows one trusted publisher per package

## Implementing JMAP Methods

See [docs/implementing-spec-features.md](docs/implementing-spec-features.md) for the workflow.
