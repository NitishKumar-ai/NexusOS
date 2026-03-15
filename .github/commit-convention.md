# Commit Convention

NexusOS uses conventional commits for automatic changelog generation.

## Format
type(scope): description

## Types
feat     — new feature
fix      — bug fix
refactor — code change, no behavior change
docs     — documentation only
chore    — maintenance, dependencies
ci       — CI/CD changes
test     — test additions or fixes
perf     — performance improvement

## Scopes
rust         — Traffic Controller changes
connectors   — MCP connector changes
dashboard    — Next.js dashboard changes
sdk-bridge   — SDK adapter changes
openclaw     — OpenClaw skill changes
harness      — Agent harness changes
ci           — GitHub Actions changes

## Examples
feat(connectors): add Twilio SMS connector
fix(rust): resolve P2 HITL gate race condition
docs(readme): update quick start for 25 connectors
ci: add cargo audit to security workflow
chore(deps): bump firebase-admin to 13.x
