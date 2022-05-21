import { copy, final, isArray } from "ntils";

import { AnyFunction } from "./AnyFunction";
import { EventDescriptor } from "./EventDescriptor";
import { EventMap } from "./EventMap";

export abstract class AbstractEventEmitter<T extends EventMap = any> {
  // 最多添加多少个 listener
  protected static _maxListeners_ = 1024;

  // 所有自定义事件
  protected static _composeEvents_: Record<string, EventDescriptor> = {};

  /**
   * 注册自定义事件(只在代理 dom 对象时有效)
   * @param {object} descriptor 事件定义
   * @returns {void} 无返回
   */
  public static register(descriptor: EventDescriptor) {
    const name = descriptor && descriptor.name;
    if (!name) {
      return;
    }
    const names = isArray(name) ? name : [name];
    names.forEach(name => {
      AbstractEventEmitter._composeEvents_[name] = descriptor;
    });
  }

  /**
   * 注册自定义事件(只在代理 dom 对象时有效)
   * @param {object} descriptor 事件定义
   * @returns {void} 无返回
   */
  public static defineEvent(descriptor: EventDescriptor) {
    return AbstractEventEmitter.register(descriptor);
  }

  public static getEventDescriptor(name: string) {
    return AbstractEventEmitter._composeEvents_[name];
  }

  private _isEventTarget_: boolean;
  private _listeners_: Record<string, AnyFunction[]> = {};
  private _target_: any;

  /**
   * 构建一个一个事修的触发器对象
   * @param {object} target 将代理的目标对象可以省略
   * @returns {void} 无返回
   */
  constructor(target?: any) {
    target = target || this;
    const emitter = target._emitter_;
    if (emitter) {
      return emitter;
    }
    final(this, "_target_", target);
    final(target, "_emitter_", this);
    this._isEventTarget_ = this._isEventTargetObject(this._target_);
    this._listeners_ = this._listeners_ || {};
  }

  /**
   * 检查是否原生支持事件
   * @param {object} obj 对象
   * @returns {void} 检查结果
   */
  private _isEventTargetObject(obj: any) {
    return obj.addEventListener && obj.removeEventListener && obj.dispatchEvent;
  }

  /**
   * 添加一个事件监听函数
   * @param {string} name 事件名称
   * @param {function} listener 事件处理函数
   * @param {capture} capture 是否是捕获阶段事件(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  public addListener<N extends Exclude<keyof T, number | symbol>>(
    name: N,
    listener: T[N],
    capture = false
  ) {
    if (this._isEventTarget_) {
      this._addNativeEventListener(name, listener, capture);
    }
    this._listeners_[name] = this._listeners_[name] || [];
    this._listeners_[name].push(listener);
    const maxListeners = AbstractEventEmitter._maxListeners_;
    if (this._listeners_[name].length > maxListeners) {
      console.warn(
        `The '${name}' event listener is not more than ${maxListeners}`,
        this
      );
    }
  }

  public addEventListener(
    ...args: Parameters<AbstractEventEmitter<T>["addListener"]>
  ) {
    return this.addListener(...args);
  }

  public on(...args: Parameters<AbstractEventEmitter<T>["addListener"]>) {
    return this.addListener(...args);
  }

  /**
   * 移除「一个/一组/所有」事件监听函数
   * @param {string} name 事件名称
   * @param {function} listener 事件处理函数
   * @param {capture} capture 是否是捕获阶段事件(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  public removeListener<N extends Exclude<keyof T, number | symbol>>(
    name: N,
    listener?: T[N],
    capture = false
  ) {
    if (name && listener) {
      if (this._isEventTarget_) {
        this._removeNativeEventListener(name, listener, capture);
      }
      if (!this._listeners_[name]) {
        return;
      }
      const index = this._listeners_[name].indexOf(listener);
      if (index > -1) {
        this._listeners_[name].splice(index, 1);
      }
    } else if (name) {
      if (this._isEventTarget_ && this._listeners_[name]) {
        this._listeners_[name].forEach(it => {
          this.removeListener(name, it as any, capture);
        });
      }
      delete this._listeners_[name];
    } else {
      Object.keys(this._listeners_).forEach(name => {
        this.removeListener(
          name as Exclude<keyof T, number | symbol>,
          null,
          capture
        );
      });
      this._listeners_ = {};
    }
  }

  public removeEventListener(
    ...args: Parameters<AbstractEventEmitter<T>["removeListener"]>
  ) {
    return this.removeListener(...args);
  }

  public off(...args: Parameters<AbstractEventEmitter<T>["removeListener"]>) {
    return this.removeListener(...args);
  }

  /**
   * 触发自身的一个事件
   * @param {string} name 事件名称
   * @param {object} data 传递的对象
   * @param {string} canBubble 能否冒泡(只在代理 dom 对象时有效)
   * @param {object} cancelAble 能否取消(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  protected emit<N extends Exclude<keyof T, number | symbol>>(
    name: N,
    data?: Parameters<T[N]>[0],
    canBubble = false,
    cancelAble = false
  ): void {
    if (this._isEventTarget_) {
      return this._emitNativeEvent(name, data, canBubble, cancelAble);
    }
    if (!this._listeners_[name]) {
      return;
    }
    const handlers = this._listeners_[name].slice(0);
    handlers.forEach((handler: Function) => handler.call(this._target_, data));
  }

  /**
   * 触发自身的一个事件 (支持异步 handler，串行执行，仅对非 dom 对象有效)
   * @param {string} name 事件名称
   * @param {object} data 传递的对象
   * @param {string} canBubble 能否冒泡(只在代理 dom 对象时有效)
   * @param {object} cancelAble 能否取消(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  protected emitAsync<N extends Exclude<keyof T, number | symbol>>(
    name: N,
    data?: Parameters<T[N]>[0],
    canBubble = false,
    cancelAble = false
  ): Promise<void> {
    if (this._isEventTarget_) {
      return this._emitNativeEvent(name, data, canBubble, cancelAble);
    }
    if (!this._listeners_[name]) {
      return;
    }
    const handlers = this._listeners_[name].slice(0);
    handlers.reduce(async (result: any, handler) => {
      if ((await result) === false) {
        return false;
      }
      return handler.call(this._target_, data);
    }, null);
  }

  /**
   * 触发自身的一个事件 (支持异步 handler，并行执行，仅对非 dom 对象有效)
   * @param {string} name 事件名称
   * @param {object} data 传递的对象
   * @param {string} canBubble 能否冒泡(只在代理 dom 对象时有效)
   * @param {object} cancelAble 能否取消(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  protected emitParallel<N extends Exclude<keyof T, number | symbol>>(
    name: N,
    data?: Parameters<T[N]>[0],
    canBubble = false,
    cancelAble = false
  ): Promise<void[]> {
    if (this._isEventTarget_) {
      return this._emitNativeEvent(name, data, canBubble, cancelAble);
    }
    if (!this._listeners_[name]) {
      return;
    }
    const handlers = this._listeners_[name].slice(0);
    return Promise.all(
      handlers.map(handler => {
        return handler.call(this._target_, data);
      })
    );
  }

  /**
   * 添加 DOM 元素事件
   * @param {string} name 事件名称
   * @param {function} handler 事件处理函数
   * @param {capture} capture 是否是捕获阶段事件
   * @returns {void} 无返回
   */
  private _addNativeEventListener(
    name: string,
    handler: Function,
    capture = false
  ) {
    this._target_.addEventListener(name, handler, capture);
    // 如果存在已注册的自定义 “组合事件”
    const descriptor = AbstractEventEmitter.getEventDescriptor(name);
    if (descriptor) {
      descriptor.addListener(this, name, handler, capture);
    }
  }

  /**
   * 移除 DOM 元素事件
   * @param {string} name 事件名称
   * @param {function} handler 事件处理函数
   * @param {capture} capture 是否是捕获阶段事件
   * @returns {void} 无返回
   */
  private _removeNativeEventListener(
    name: string,
    handler: Function,
    capture = false
  ) {
    this._target_.removeEventListener(name, handler, capture);
    // 如果存在已注册的自定义 “组合事件”
    const descriptor = AbstractEventEmitter.getEventDescriptor(name);
    if (descriptor) {
      descriptor.removeListener(this, name, handler, capture);
    }
  }

  /**
   * 触发 DOM 元素事件
   * @param {string} name 事件名称
   * @param {object} data 传递的对象
   * @param {string} canBubble 能否冒泡
   * @param {object} cancelAble 能否取消
   * @returns {void} 无返回
   */
  private _emitNativeEvent(
    name: string,
    data: any,
    canBubble = false,
    cancelAble = false
  ) {
    if (typeof document === "undefined") {
      return;
    }
    const event = document.createEvent("HTMLEvents");
    event.initEvent(name, canBubble, cancelAble);
    copy(data, event, ["data"]);
    (event as any).data = data;
    return this._target_.dispatchEvent(event);
  }
}
