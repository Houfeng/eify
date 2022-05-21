import { EventEmitter } from "./EventEmitter";

export interface EventDescriptor {
  name: string | string[];
  addListener: (
    emitter: EventEmitter<any>,
    name: string,
    listener: Function,
    capture: boolean
  ) => void;
  removeListener: (
    emitter: EventEmitter<any>,
    name: string,
    listener: Function,
    capture: boolean
  ) => void;
}
