# eify 

Eify is an EventEmitter that supports "synchronous, asynchronous, parallel and serial" triggering, and has good support for typescript

# Usage

```ts
import { AbstractEventEmitter, EventEmitter } from 'eify';

// AbstractEventEmitter ------------------------------------------------------

export class MyClass extends AbstractEventEmitter<{
  change1: (value: number) => void
  change2: (value: string) => void
}> {
  trigger() {
    this.emit("change1", 1);      // ✅ 
    this.emit("change1", "1");    // ❌ 
    this.emit("change2", "2");    // ✅
    this.emit("change2", 2);      // ❌ 
  }
}

const myInstance = new MyClass();
myInstance.emit('change1', 1);    // ❌

// EventEmitter 1 ------------------------------------------------------------

const emitter = new EventEmitter<{
  change1: (value: number) => void
  change2: (value: string) => void
}>();

emitter.emit("change1", 1);       // ✅ 
emitter.emit("change1", "1");     // ❌ 
emitter.emit("change2", "2");     // ✅
emitter.emit("change2", 2);       // ❌ 

// EventEmitter 2 ------------------------------------------------------------

export class MyClass {
  private emitter = emitter = new EventEmitter<{
    change1: (value: number) => void
    change2: (value: string) => void
  }>();

  on:MyClass["emitter"]["on"] = (...args)=>
    this.emitter.on(...args);

  off:MyClass["emitter"]["off"] = (...args)=>
    this.emitter.off(...args);

  trigger() {
    this.emit("change1", 1);      // ✅ 
    this.emit("change1", "1");    // ❌ 
    this.emit("change2", "2");    // ✅
    this.emit("change2", 2);      // ❌ 
  }
}

const myInstance = new MyClass();
myInstance.emit('change1', 1);    // ❌

// Async emit ----------------------------------------------------------------

const emitter = new EventEmitter<{
  change: (value: number) => Promise<void>
}>();

emitter.on("change",async (value)=>{
  console.log(value);
});

// Wait for the asynchronous execution of all handlers to complete
await emitter.emitAsync("change", 1);   

// Wait for the asynchronous execution of all handlers to complete
// All handlers will execute in parallel
await emitter.emitParallel("change", 1);   

```