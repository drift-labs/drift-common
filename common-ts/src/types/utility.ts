/**
 * This is a utility type that is used to create opaque types.
 *
 * E.g.
 * ```ts
 * type MyOpaqueType = Opaque<"MyOpaqueType", string>;
 * ```
 *
 * This will create a type that is a string, but will not allow you to assign any other type to it.
 *
 * ```ts
 */
export type Opaque<K, T> = T & { __TYPE__: K };
