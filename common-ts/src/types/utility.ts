// Opaque type pattern
export type Opaque<K, T> = T & { __TYPE__: K };
