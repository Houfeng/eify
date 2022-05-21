import { AbstractEventEmitter } from "./AbstractEventEmitter";

export interface EventDescriptor {
  name: string | string[];
  addListener: (
    emitter: AbstractEventEmitter<any>,
    name: string,
    listener: Function,
    capture: boolean
  ) => void;
  removeListener: (
    emitter: AbstractEventEmitter<any>,
    name: string,
    listener: Function,
    capture: boolean
  ) => void;
}
