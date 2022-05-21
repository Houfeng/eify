import { AnyFunction } from "./AnyFunction";
import { DOMEventEmitter } from "./DOMEventEmitter";

export interface DOMEventDescriptor {
  name: string | string[];
  addListener: (
    emitter: DOMEventEmitter<any>,
    name: string,
    listener: AnyFunction,
    capture: boolean
  ) => void;
  removeListener: (
    emitter: DOMEventEmitter<any>,
    name: string,
    listener: AnyFunction,
    capture: boolean
  ) => void;
}
