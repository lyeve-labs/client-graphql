import type { HttpClient } from "@lyeve-labs/client";

// Types

export interface GraphQLResponse<T = unknown> {
  data: T | null;
  errors?: {
    message: string;
    locations?: { line: number; column: number }[];
    path?: string[];
  }[];
}

export interface GraphQLClientConfig {
  httpClient: HttpClient;
  /** Base URL for the GraphQL endpoint. Default: '' (relative path /api/v1/graphql). */
  baseUrl?: string;
  /** Auth token for WebSocket subscriptions. */
  token?: string;
}

export interface SubscriptionHandlers<T = unknown> {
  onData: (data: T) => void;
  onError?: (err: Error) => void;
  onComplete?: () => void;
}

export interface SubscriptionHandle {
  unsubscribe: () => void;
}

// Client

const IDLE_BEFORE_PING_MS = 45_000;
const PONG_TIMEOUT_MS = 15_000;

export class GraphQLClient {
  #config: GraphQLClientConfig;
  #httpClient: HttpClient;
  #baseUrl: string;

  constructor(config: GraphQLClientConfig) {
    this.#config = config;
    this.#httpClient = config.httpClient;
    this.#baseUrl = config.baseUrl ?? "";
  }

  /** Execute a GraphQL query via POST /api/v1/graphql. */
  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<GraphQLResponse<T>> {
    return this.#httpClient.post<GraphQLResponse<T>>(
      `${this.#baseUrl}/api/v1/graphql`,
      { query, variables },
    );
  }

  /** Execute a GraphQL mutation via POST /api/v1/graphql. */
  async mutate<T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>,
  ): Promise<GraphQLResponse<T>> {
    return this.#httpClient.post<GraphQLResponse<T>>(
      `${this.#baseUrl}/api/v1/graphql`,
      { query: mutation, variables },
    );
  }

  /**
   * Subscribe to a GraphQL subscription over WebSocket (graphql-ws protocol).
   * Connects to ws://host/api/v1/graphql/ws.
   *
   * The ws URL is derived from the baseUrl. For http://localhost:3001,
   * the WebSocket connects to ws://localhost:3001/api/v1/graphql/ws.
   */
  subscribe<T = unknown>(
    subscription: string,
    variables: Record<string, unknown> | undefined,
    handlers: SubscriptionHandlers<T>,
  ): SubscriptionHandle {
    const wsUrl = this.#baseUrl.replace(/^http/, "ws") + "/api/v1/graphql/ws";

    const ws = new WebSocket(wsUrl, "graphql-transport-ws");
    let unsubscribed = false;
    let subId: string | null = null;
    let keepAlive: ReturnType<typeof setTimeout> | undefined;

    // The subscription ends once, whichever way it ends, so the app hears
    // about it once and nothing reaches it afterward.
    const end = (err?: Error) => {
      clearTimeout(keepAlive);
      if (unsubscribed) return;
      unsubscribed = true;
      if (err) handlers.onError?.(err);
    };

    // Any message proves the connection alive. After a silence the client
    // pings, and a further silence means the connection is gone. A pong is
    // not required: earlier servers do not answer pings, but they ping
    // every 30 seconds while a subscription runs.
    const awaitTraffic = (pinged = false) => {
      clearTimeout(keepAlive);
      keepAlive = setTimeout(
        () => {
          if (!pinged) {
            ws.send(JSON.stringify({ type: "ping" }));
            awaitTraffic(true);
            return;
          }
          end(
            new Error(
              "WebSocket connection lost: the server did not answer a ping",
            ),
          );
          ws.close();
        },
        pinged ? PONG_TIMEOUT_MS : IDLE_BEFORE_PING_MS,
      );
    };

    ws.onopen = () => {
      const payload = this.#config.token
        ? { authorization: `Bearer ${this.#config.token}` }
        : {};
      ws.send(JSON.stringify({ type: "connection_init", payload }));
      awaitTraffic();

      ws.onmessage = (e: MessageEvent) => {
        if (unsubscribed) return;
        awaitTraffic();
        const msg = JSON.parse(e.data);
        if (msg.type === "ping") {
          ws.send(
            JSON.stringify(
              msg.payload === undefined
                ? { type: "pong" }
                : { type: "pong", payload: msg.payload },
            ),
          );
          return;
        }
        if (msg.type === "connection_ack") {
          subId =
            (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
            `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
          ws.send(
            JSON.stringify({
              id: subId,
              type: "subscribe",
              payload: { query: subscription, variables: variables ?? {} },
            }),
          );
          return;
        }
        if (!subId || msg.id !== subId) return;
        if (msg.type === "next") handlers.onData(msg.payload.data as T);
        else if (msg.type === "error")
          handlers.onError?.(new Error(JSON.stringify(msg.payload)));
        else if (msg.type === "complete") {
          handlers.onComplete?.();
          end();
          ws.close();
        }
      };
    };

    // An error event is always followed by a close event, which then has
    // nothing to add.
    ws.onerror = () => end(new Error("WebSocket error"));

    ws.onclose = (e: CloseEvent) =>
      end(
        new Error(
          `WebSocket closed with code ${e.code}` +
            (e.reason ? `: ${e.reason}` : ""),
        ),
      );

    return {
      unsubscribe: () => {
        // Before the ack the socket may still be connecting, where a send
        // throws, and the server holds no operation to complete.
        if (subId && !unsubscribed)
          ws.send(JSON.stringify({ id: subId, type: "complete" }));
        end();
        ws.close(1000);
      },
    };
  }
}

/** Create a GraphQL client backed by an existing HttpClient. */
export function createGraphQLClient(
  config: GraphQLClientConfig,
): GraphQLClient {
  return new GraphQLClient(config);
}
