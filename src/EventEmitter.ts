import { AbstractEventEmitter, StringKeyOf } from "./AbstractEventEmitter";

import { EventEmitterOptions } from "./EventEmitterOptions";
import { EventMap } from "./EventMap";

export class EventEmitter<
  T extends EventMap = EventMap
> extends AbstractEventEmitter<T> {
  constructor(options?: EventEmitterOptions) {
    super(options);
  }

  public emit<N extends StringKeyOf<T>>(
    name: N,
    ...args: Parameters<T[N]>
  ): ReturnType<T[N]>[] {
    return super.emit(name, ...args);
  }

  public emitSerial<N extends StringKeyOf<T>>(
    name: N,
    ...args: Parameters<T[N]>
  ): Promise<boolean> {
    return super.emitSerial(name, ...args);
  }

  public emitParallel<N extends StringKeyOf<T>>(
    name: N,
    ...args: Parameters<T[N]>
  ): Promise<ReturnType<T[N]>[]> {
    return super.emitParallel(name, ...args);
  }

  public emitAsync<N extends StringKeyOf<T>>(
    name: N,
    ...args: Parameters<T[N]>
  ): Promise<ReturnType<T[N]>[]> {
    return this.emitAsync(name, ...args);
  }
}
