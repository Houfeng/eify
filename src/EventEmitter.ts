import { AbstractEventEmitter } from "./AbstractEventEmitter";
import { EventMap } from "./EventMap";

export class EventEmitter<T extends EventMap = any>
  extends AbstractEventEmitter<T> {
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
