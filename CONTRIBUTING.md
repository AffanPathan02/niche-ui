# Contributing to Niche UI

Thank you for your interest! Niche UI is an open source React component library focused on complex, niche UI patterns.

## Project Philosophy

Every component is built in three layers:

| Layer                                      | What it is                             | Who uses it                          |
| ------------------------------------------ | -------------------------------------- | ------------------------------------ |
| **Hook** (`useXxxLayout`)                  | Pure logic — no JSX, no DOM, no styles | Canvas, WebGL, framework-agnostic    |
| **Headless** (`XxxRoot`, `XxxNodes`, etc.) | DOM structure + a11y, zero CSS         | Full visual control via render props |
| **Styled** (`<Xxx />`)                     | Drop-in default, basic style props     | Quick start                          |

When contributing a new component, implement all three layers. When fixing a bug, identify which layer it lives in.

## Setup

```bash
# Clone the repo
git clone https://github.com/your-org/niche-ui.git
cd niche-ui

# Install dependencies (pnpm required)
pnpm install

# Build all packages
pnpm build

# Run the playground
pnpm dev

# Run tests
pnpm test

# Typecheck
pnpm typecheck
```

## Making Changes

### Bug fix or small improvement

1. Fork and create a branch: `git checkout -b fix/tree-layout-overlap`
2. Make your change
3. Run `pnpm test` and `pnpm typecheck`
4. Add a changeset: `pnpm changeset`
5. Commit and open a PR

### New component

1. Open an issue first to discuss the design
2. Create `packages/<name>/` following the structure of `packages/tree/`
3. Implement all three layers
4. Add tests in `src/**/__tests__/`
5. Add a demo in `apps/playground/src/`
6. Add a changeset and open a PR

## Changeset Workflow

We use [Changesets](https://github.com/changesets/changesets) for versioning.

- **User-facing change** (bug fix, new feature): always add a changeset with `pnpm changeset`
- **Internal change** (tooling, CI, docs): no changeset needed
- **Breaking change**: use a `major` bump and describe the migration path in the changeset

## Code Style

- TypeScript strict mode — all files must pass `tsc --noEmit`
- Prettier is enforced via CI — run `pnpm format` before pushing
- ESLint — run `pnpm lint` before pushing

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(tree): add curved edge support
fix(tree): correct centering for single-child nodes
chore: upgrade vitest to 2.0
docs: add useTreeLayout JSDoc examples
```

## Package Boundaries

- `@niche-ui/utils` — shared types and math. Zero React dependency.
- `@niche-ui/tsconfig` — shared TS config. Dev-time only, not published to users.
- `@niche-ui/tree` — tree/AST visualiser. Depends on `utils`, peer-depends on React.
- Never create circular dependencies between packages.

## Questions?

Open a [discussion](https://github.com/your-org/niche-ui/discussions) on GitHub.
