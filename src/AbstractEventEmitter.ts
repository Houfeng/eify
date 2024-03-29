import { AnyFunction } from "./AnyFunction";
import { EventEmitterOptions } from "./EventEmitterOptions";
import { EventMap } from "./EventMap";

export type StringKeyOf<T> = Exclude<keyof T, number | symbol>;

export abstract class AbstractEventEmitter<T extends EventMap = EventMap> {
  private __maxListeners: number;
  private __listeners: Record<string, AnyFunction[]>;
  private __requireLoopRemove: boolean;

  constructor(options?: EventEmitterOptions & { requireLoopRemove?: boolean }) {
    const { maxListeners = 1024, requireLoopRemove = false } = {
      ...options
    };
    this.__maxListeners = maxListeners;
    this.__listeners = {};
    this.__requireLoopRemove = requireLoopRemove;
  }

  public addListener<N extends StringKeyOf<T>>(name: N, listener: T[N]): void {
    this.__listeners[name] = this.__listeners[name] || [];
    this.__listeners[name].push(listener);
    const maxListeners = this.__maxListeners;
    if (this.__listeners[name].length > maxListeners) {
      const error = `The '${name}' listener is not more than ${maxListeners}`;
      console.warn(error, this);
    }
  }

  public on<N extends StringKeyOf<T>>(name: N, listener: T[N]): void {
    return this.addListener(name, listener);
  }

  public removeListener<N extends StringKeyOf<T>>(
    name: N,
    listener: T[N]
  ): void {
    if (!this.__listeners[name] || !listener) return;
    this.__listeners[name] = this.__listeners[name].filter(
      it => it !== listener
    );
  }

  public off<N extends StringKeyOf<T>>(name: N, listener: T[N]): void {
    return this.removeListener(name, listener);
  }

  public removeAllListener<N extends StringKeyOf<T>>(name?: N): void {
    if (name) {
      if (this.__requireLoopRemove && this.__listeners[name]) {
        this.__listeners[name].slice(0).forEach(it => {
          this.removeListener(name, it as T[N]);
        });
      }
      this.__listeners[name] = [];
    } else {
      if (this.__requireLoopRemove) {
        Object.keys(this.__listeners).forEach(it => {
          this.removeAllListener(it as N);
        });
      }
      this.__listeners = {};
    }
  }

  protected emit<N extends StringKeyOf<T>>(
    name: N,
    ...args: Parameters<T[N]>
  ): ReturnType<T[N]>[] {
    if (!this.__listeners[name]) return;
    const listeners = this.__listeners[name].slice(0);
    return listeners.map(it => it.call(this, ...args));
  }

  protected emitSerial<N extends StringKeyOf<T>>(
    name: N,
    ...args: Parameters<T[N]>
  ): Promise<boolean> {
    if (!this.__listeners[name]) return;
    const listeners = this.__listeners[name].slice(0);
    return listeners.reduce(async (result: any, it) => {
      if ((await result) === false) return false;
      return it.call(this, ...args);
    }, true);
  }

  protected emitParallel<N extends StringKeyOf<T>>(
    name: N,
    ...args: Parameters<T[N]>
  ): Promise<ReturnType<T[N]>[]> {
    if (!this.__listeners[name]) return;
    const listeners = this.__listeners[name].slice(0);
    return Promise.all(listeners.map(it => it.call(this, ...args)));
  }

  protected emitAsync<N extends StringKeyOf<T>>(
    name: N,
    ...args: Parameters<T[N]>
  ): Promise<ReturnType<T[N]>[]> {
    return this.emitParallel(name, ...args);
  }
}
