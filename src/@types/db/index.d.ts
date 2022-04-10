export {};

declare module 'pg' {
    type AnyClient = Client | PoolClient | Pool;
}
