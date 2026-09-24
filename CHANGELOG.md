# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The README examples use the schema the server generates. There is no
  `schemas` root field and no `createSchema` mutation: each content schema gets
  its own list and single-record queries and `create`, `update` and `delete`
  mutations, and the `contentChanged` payload field is `recordId`, not
  `record_id`. The README documents the `token` option subscriptions need and
  says that `baseUrl` is an origin prefix, not an endpoint override. The Node
  floor reads 24.

## [0.1.8] - 2026-09-12

### Fixed

- The package manifest carries `repository`, `homepage` and `bugs`, so the npm
  page links back to the source and the issue tracker. It published with none
  of the three, which left a reader on npm with no way back to the code.

### Changed

- The declared Node floor is 24. Continuous integration has run on Node 24 for
  some time and the manifest still said 20, which described a runtime nothing
  was tested against. Node 22 consumers are no longer within the declared
  range.
- `prepublishOnly` runs the build, so a publish cannot skip the package lint,
  the dist check or the version check. All three ran only from the build
  script before, and a bare publish uploaded whatever `dist` happened to hold.
  The version check refuses when `package.json` and the CHANGELOG head name
  different versions.

## [0.1.7] - 2026-09-09

### Changed

- Documentation and shipped strings no longer carry em dashes, unicode
  ellipses or unicode bullets. Where a string is an error or a log line the
  wording changed and nothing else: status codes, machine-readable error codes
  and behaviour are untouched, so a client matching on a code is unaffected.
- An elision inside a code span now uses three ASCII periods, so a reader who
  copies one gets something their tool accepts.

## [0.1.6] - 2026-09-06

### Fixed

- Supersede 0.1.5, which was published to npm from an unmerged `dev` commit and
  therefore exists under no git tag. Publishing moved off the tag in
  `ci: publish this package by hand, not from a tag` and nothing replaced the
  tag step, so a published version left no ref behind. The code users are
  running is unchanged; this release gives it a tag, a `main` merge and an
  entry here. A published version is superseded, never rewritten.

## [0.1.5] - 2026-09-02

### Changed

- CONTRIBUTING documents the branch model. It covered commits and releases but never said which branch a change starts from: work branches off `dev` and the PR goes back into `dev`, while `main` takes merges and carries the release tags.

## [0.1.4] - 2026-08-12

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
