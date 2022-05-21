import { AbstractEventEmitter } from "./AbstractEventEmitter";
import { EventEmitterOptions } from "./EventEmitterOptions";
import { EventMap } from "./EventMap";

export class EventEmitter<
  T extends EventMap = EventMap
> extends AbstractEventEmitter<T> {
  constructor(options?: EventEmitterOptions) {
    super(options);
  }

  public emit(...args: Parameters<AbstractEventEmitter<T>["emit"]>) {
    return super.emit(...args);
  }

  public emitAsync(...args: Parameters<AbstractEventEmitter<T>["emitAsync"]>) {
    return super.emitAsync(...args);
  }

  public emitParallel(
    ...args: Parameters<AbstractEventEmitter<T>["emitParallel"]>
  ) {
    return super.emitParallel(...args);
  }
}
