const { final, isArray, copy, each } = require('ntils');

/**
 * 事件触发器基类
 */
class EventEmitter {

  /**
   * 构建一个一个事修的触发器对象
   * @param {object} target 将代理的目标对象可以省略
   * @returns {void} 无返回
   */
  constructor(target) {
    target = target || this;
    const emitter = target._emitter_;
    if (emitter) return emitter;
    final(this, '_target_', target);
    final(target, '_emitter_', this);
    this._isNative_ = this._isNativeObject(this._target_);
    this._listeners_ = this._listeners_ || Object.create(null);
    this.on = this.$on = this.$addListener = this.addListener;
    this.off = this.$off = this.$removeListener = this.removeListener;
    this.$emit = this.emit;
  }

  /**
   * 检查是否原生支持事件
   * @param {object} obj 对象
   * @returns {void} 检查结果
   */
  _isNativeObject(obj) {
    return obj.addEventListener && obj.removeEventListener && obj.dispatchEvent;
  }

  /**
   * 添加一个事件监听函数
   * @param {string} name 事件名称
   * @param {function} listener 事件处理函数
   * @param {capture} capture 是否是捕获阶段事件(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  addListener(name, listener, capture) {
    if (this._isNative_) {
      this._addNativeEventListener(name, listener, capture);
    }
    this._listeners_[name] = this._listeners_[name] || [];
    this._listeners_[name].push(listener);
    const maxListeners = EventEmitter._maxListeners;
    if (this._listeners_[name].length > maxListeners) {
      console.warn(
        `The '${name}' event listener is not more than ${maxListeners}`, this
      );
    }
  }

  /**
   * 移除「一个/一组/所有」事件监听函数
   * @param {string} name 事件名称
   * @param {function} listener 事件处理函数
   * @param {capture} capture 是否是捕获阶段事件(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  removeListener(name, listener, capture) {
    if (name && listener) {
      if (this._isNative_) {
        this._removeNativeEventListener(name, listener, capture);
      }
      if (!this._listeners_[name]) return;
      const index = this._listeners_[name].indexOf(listener);
      if (index > -1) this._listeners_[name].splice(index, 1);
    } else if (name) {
      if (this._isNative_ && this._listeners_[name]) {
        this._listeners_[name].forEach(function (_listener) {
          this.removeListener(name, _listener, capture);
        }, this);
      }
      delete this._listeners_[name];
    } else {
      each(this._listeners_, function (name) {
        this.removeListener(name, null, capture);
      }, this);
      this._listeners_ = {};
    }
  }

  /**
   * 触发自身的一个事件
   * @param {string} name 事件名称
   * @param {object} data 传递的对象
   * @param {string} canBubble 能否冒泡(只在代理 dom 对象时有效)
   * @param {object} cancelAble 能否取消(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  emit(name, data, canBubble, cancelAble) {
    if (this._isNative_) {
      return this._emitNativeEvent(name, data, canBubble, cancelAble);
    }
    const listeners = this._listeners_[name];
    if (!listeners) return;
    let stopPropagation = false;
    listeners.forEach(function (handler) {
      const rs = handler.call(this._target_, data);
      if (rs === false) stopPropagation = true;
    }, this);
    return stopPropagation;
  }

  /**
   * 触发自身的一个事件 (支持异步 handler，串行执行，仅对非 dom 对象有效)
   * @param {string} name 事件名称
   * @param {object} data 传递的对象
   * @param {string} canBubble 能否冒泡(只在代理 dom 对象时有效)
   * @param {object} cancelAble 能否取消(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  emitAsync(name, data, canBubble, cancelAble) {
    if (this._isNative_) {
      return this._emitNativeEvent(name, data, canBubble, cancelAble);
    }
    const listeners = this._listeners_[name];
    if (!listeners) return;
    let stopPropagation = false, queue = listeners.slice(0);
    return new Promise((resolve, reject) => {
      function done(rs, err) {
        if (err) return reject(err);
        if (rs === false) stopPropagation = true;
        return queue.length > 0 ? exec() : resolve(stopPropagation);
      }
      function exec() {
        const handler = queue.shift();
        const rs = handler.call(this._target_, data);
        return rs && rs.then ? rs.then(done) : done(rs);
      }
      exec();
    });
  }

  /**
   * 触发自身的一个事件 (支持异步 handler，并行执行，仅对非 dom 对象有效)
   * @param {string} name 事件名称
   * @param {object} data 传递的对象
   * @param {string} canBubble 能否冒泡(只在代理 dom 对象时有效)
   * @param {object} cancelAble 能否取消(只在代理 dom 对象时有效)
   * @returns {void} 无返回
   */
  emitParallel(name, data, canBubble, cancelAble) {
    if (this._isNative_) {
      return this._emitNativeEvent(name, data, canBubble, cancelAble);
    }
    const listeners = this._listeners_[name];
    if (!listeners) return;
    let stopPropagation = false, count = 0;
    return new Promise((resolve, reject) => {
      function done(rs, err) {
        if (err) return reject(err);
        if (rs === false) stopPropagation = true;
        if (++count >= listeners.length) resolve(stopPropagation);
      }
      listeners.forEach(function (handler) {
        const rs = handler.call(this._target_, data);
        return rs && rs.then ? rs.then(done) : done(rs);
      }, this);
    });
  }

  /**
   * 添加 DOM 元素事件
   * @param {string} name 事件名称
   * @param {function} listener 事件处理函数
   * @param {capture} capture 是否是捕获阶段事件
   * @returns {void} 无返回
   */
  _addNativeEventListener(name, listener, capture) {
    this._target_.addEventListener(name, listener, capture);
    //如果存在已注册的自定义 “组合事件”
    const descriptor = EventEmitter._events[name];
    if (descriptor) {
      descriptor.addListener = descriptor.addListener || descriptor.on;
      descriptor.addListener(this, name, listener, capture);
    }
  }

  /**
   * 移除 DOM 元素事件
   * @param {string} name 事件名称
   * @param {function} listener 事件处理函数
   * @param {capture} capture 是否是捕获阶段事件
   * @returns {void} 无返回
   */
  _removeNativeEventListener(name, listener, capture) {
    this._target_.removeEventListener(name, listener, capture);
    //如果存在已注册的自定义 “组合事件”
    const descriptor = EventEmitter._events[name];
    if (descriptor) {
      descriptor.removeListener = descriptor.removeListener || descriptor.off;
      descriptor.removeListener(this, name, listener, capture);
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
  _emitNativeEvent(name, data, canBubble, cancelAble) {
    if (!global.document) return;
    const event = global.document.createEvent('HTMLEvents');
    event.initEvent(name, canBubble, cancelAble);
    copy(data, event, ['data']);
    event.data = data;
    return this._target_.dispatchEvent(event);
  }

}

//最多添加多少个 listener
EventEmitter._maxListeners = 1024;

//所有自定义事件
EventEmitter._events = [];

/**
 * 注册自定义事件(只在代理 dom 对象时有效)
 * @param {object} descriptor 事件定义
 * @returns {void} 无返回
 */
EventEmitter.register = function (descriptor) {
  let names = descriptor.name;
  if (!names) return;
  if (!isArray(names)) names = names.split(',');
  names.forEach(function (name) {
    this._events[name] = descriptor;
  }, this);
};

module.exports = EventEmitter;