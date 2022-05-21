import { AnyFunction } from "./AnyFunction";

export type EventMap<F extends AnyFunction = AnyFunction> = Record<string, F>;
