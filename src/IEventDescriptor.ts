import { EventEmitter } from './EventEmitter';

export interface IEventDescriptor {
  name: string | string[];
  addListener: (emitter: EventEmitter, name: string, listener: Function, capture: boolean) => void;
  removeListener: (emitter: EventEmitter, name: string, listener: Function, capture: boolean) => void;
}