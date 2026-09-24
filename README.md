# @lyeve-labs/client-graphql

GraphQL client for LyEve Core. Queries, mutations, and subscriptions over
WebSocket.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org)

```bash
pnpm add @lyeve-labs/client @lyeve-labs/client-graphql
```

```ts
import { createClient } from "@lyeve-labs/client";
import { createGraphQLClient } from "@lyeve-labs/client-graphql";

const http = createClient(fetch, { Authorization: "Bearer <token>" });
const gql = createGraphQLClient({ httpClient: http });

const { data } = await gql.query(`{ articles(limit: 10) { id title } }`);
```

Query, mutate, subscribe. One client, all three operations.

---

## What's in the box

- **Queries:** typed `query<T>(query, variables?)` over HTTP POST.
- **Mutations:** typed `mutate<T>(mutation, variables?)` over HTTP POST.
- **Subscriptions:** `subscribe<T>(query, variables, handlers)` over WebSocket
  using the `graphql-transport-ws` protocol.
- **Thin layer:** delegates HTTP to `@lyeve-labs/client` so auth, error handling,
  and retry just work.

## Requirements

- **Node 24** or newer
- **[@lyeve-labs/client](https://www.npmjs.com/package/@lyeve-labs/client)** `>=0.2.1`

## Install

```bash
pnpm add @lyeve-labs/client @lyeve-labs/client-graphql
# or npm install @lyeve-labs/client @lyeve-labs/client-graphql
# or yarn add @lyeve-labs/client @lyeve-labs/client-graphql
```

## Use

The GraphQL schema is generated from your content schemas. A content schema
named `articles` gets a list query `articles(limit, offset, where)`, a
single-record query `article(id)`, and the mutations `createArticles`,
`updateArticles` and `deleteArticles`. Hyphens in a schema name become
underscores in field names, and type names are PascalCase (`blog-posts` gives
`blog_posts` and `createBlogPosts`). Only schemas whose transports allow
GraphQL appear.

```ts
import { createClient } from "@lyeve-labs/client";
import { createGraphQLClient } from "@lyeve-labs/client-graphql";

const token = "<token>";
const http = createClient(fetch, { Authorization: `Bearer ${token}` });
const gql = createGraphQLClient({
  httpClient: http,
  baseUrl: "http://localhost:3002",
  token,
});

interface Article {
  id: string;
  title: string;
}

// Query
const { data, errors } = await gql.query<{ articles: Article[] }>(
  `{ articles(limit: 10) { id title } }`,
);

// Mutation
const created = await gql.mutate<{ createArticles: Article }>(
  `mutation ($input: ArticlesInput!) { createArticles(input: $input) { id title } }`,
  { input: { title: "Hello" } },
);

// Subscription
const sub = gql.subscribe<{
  contentChanged: { schema: string; action: string; recordId: string };
}>(
  `subscription { contentChanged(schema: "articles") { schema action recordId } }`,
  {},
  {
    onData: (ev) => console.log("change:", ev.contentChanged.recordId),
    onError: (err) => console.error(err),
  },
);
// Later: sub.unsubscribe();
```

The subscription root also carries `schemaChanged { schema action timestamp }`.

## API

| Method                                            | Description                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `query<T>(query, variables?)`                     | GraphQL query via `POST /api/v1/graphql`                                     |
| `mutate<T>(mutation, variables?)`                 | GraphQL mutation via `POST /api/v1/graphql`                                  |
| `subscribe<T>(subscription, variables, handlers)` | Subscribe over WebSocket (`graphql-transport-ws`). Returns `{ unsubscribe }` |

### Config

| Option       | Description                                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient` | The `@lyeve-labs/client` instance queries and mutations go through. Its headers carry the auth for HTTP.                                                                         |
| `baseUrl`    | Origin prefixed to the fixed paths `/api/v1/graphql` and `/api/v1/graphql/ws`. Default `""` (relative). Subscriptions derive the `ws:` URL from it, so set it to the API origin. |
| `token`      | Bearer token sent in the WebSocket `connection_init` payload. The subscription endpoint requires an authenticated user, and a browser cannot set headers on a WebSocket.         |

## Local development

```bash
pnpm install            # install dependencies
pnpm test               # run unit tests
pnpm check              # type-check
pnpm build              # tsup + publint -> dist/
```

## Project layout

```
src/
  client.ts          # createGraphQLClient
  index.ts           # public API
tests/               # vitest test suite
```

## Versioning

`@lyeve-labs/client-graphql` follows [SemVer](https://semver.org). While under `1.0`,
breaking changes bump the **minor** version; additive changes bump the **patch**.
Every release is logged in [`CHANGELOG.md`](CHANGELOG.md).

## Contributing

Bug reports and feature requests are welcome. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the development setup and conventions.

## License

MIT. See [`LICENSE`](LICENSE).
