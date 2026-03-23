# Agent Instructions

Welcome, agent! This file contains instructions and guidelines for working on the `phin-retry` repository.

## Repository Overview
`phin-retry` is an ultra-lightweight Node.js HTTP client that supports automatic retries with custom delay and retry strategies. It is built on top of `phinx`.

## Development Guidelines

### Node.js Version
- This project requires Node.js version 20 or higher.

### Dependency Management
- Always use `npm` for managing dependencies.
- Ensure dependencies are kept up to date.

### Testing
- We use `uvu` for testing and `pactum` for API mocking.
- To run tests: `npm test`
- To run coverage: `npm run coverage`
- Before submitting any changes, ensure all tests pass.

### Continuous Integration and Delivery
- **GitHub Actions**: Workflows for build, coverage, and publishing are located in `.github/workflows/`.
- **Release Please**: We use `release-please` to manage releases. Ensure commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) specification to trigger releases and changelog updates.
- **Publishing**: Releases are automatically published to NPM upon merging a release PR. We use OIDC for secure publishing with provenance.

### Code Style
- Follow existing code patterns in `src/` and `tests/`.
- Maintain the lightweight nature of the library.
