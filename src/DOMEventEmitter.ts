import { AbstractEventEmitter, StringKeyOf } from "./AbstractEventEmitter";

import { DOMEventDescriptor } from "./DOMEventDescriptor";
import { EventEmitterOptions } from "./EventEmitterOptions";
import { EventMap } from "./EventMap";

export class DOMEventEmitter<
  T extends EventMap = EventMap
> extends AbstractEventEmitter<T> {
  protected static __composeEvents: Record<string, DOMEventDescriptor> = {};

  public static defineEvent(descriptor: DOMEventDescriptor) {
    const name = descriptor && descriptor.name;
    if (!name) return;
    const names = name instanceof Array ? name : [name];
    names.forEach(it => {
      DOMEventEmitter.__composeEvents[it] = descriptor;
    });
  }

  public static getEventDescriptor(name: string) {
    return DOMEventEmitter.__composeEvents[name];
  }

  protected __removeRequireOneByOne = true;

  constructor(public target: EventTarget, options?: EventEmitterOptions) {
    super(options);
  }

  public addListener<N extends StringKeyOf<T>>(
    name: N,
    listener: T[N],
    capture = false
  ) {
    super.addListener(name, listener);
    this.target.addEventListener(name, listener, capture);
    const descriptor = DOMEventEmitter.getEventDescriptor(name);
    if (!descriptor) return;
    descriptor.addListener(this, name, listener, capture);
  }

  public removeListener<N extends StringKeyOf<T>>(
    name: N,
    listener?: T[N],
    capture = false
  ) {
    super.removeListener(name, listener);
    this.target.removeEventListener(name, listener, capture);
    const descriptor = DOMEventEmitter.getEventDescriptor(name);
    if (!descriptor) return;
    descriptor.removeListener(this, name, listener, capture);
  }

  public dispatch<N extends StringKeyOf<T>>(
    name: string,
    detail: Parameters<T[N]>[0],
    options?: {
      cancelable: boolean;
      bubbles: boolean;
    }
  ) {
    const event = new CustomEvent(name, { ...options, detail });
    return this.target.dispatchEvent(event);
  }
}
