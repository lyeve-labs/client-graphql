# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Move to node 24 and pnpm 10.33.4.
- Build against client 0.3.0, and raise the `@lyeve-labs/client` peer floor to
  0.2.1. The previous floor allowed 0.1.x, which was never published to the registry.

## [0.1.3] - 2026-08-04

### Fixed

- Split the `types` export condition so TypeScript resolves `.d.ts` under `import` and `.d.cts` under `require`.

## [0.1.2] - 2026-07-28

Published with no user-facing changes; repository tooling only.

## [0.1.1] - 2026-07-24

### Fixed

- Subscribe race condition eliminated by replacing the two-phase handler swap with a single handler that branches on message type. Messages arriving between `connection_init` and `connection_ack` are no longer lost.
- Auth token is now sent as `connection_init` payload for authenticated GraphQL subscriptions.

## [0.1.0] - 2026-07-23

### Added

- Initial release.
- `createGraphQLClient` factory that builds a typed GraphQL client on top of the core `HttpClient`.
- Support for GraphQL queries, mutations, and subscriptions over WebSocket transport.
- Generic `GraphQLResponse<T>` type for typed response handling and error extraction.
- Subscription lifecycle management with `SubscriptionHandlers` callbacks and `SubscriptionHandle` for teardown.
