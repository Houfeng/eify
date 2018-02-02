const assert = require('assert');
const EventEmitter = require('../../lib');

class Tester extends EventEmitter {
  constructor() {
    super();
    this.name = 'test';
  }
}

describe('EventEmitter', function () {

  it('on', function (done) {
    const tester = new Tester();
    tester.on('say', e => {
      console.log('say', e);
      assert.equal(e, 1);
      done();
    });
    tester.emit('say', 1);
  });

  it('off', function (done) {
    const tester = new Tester();
    const handelr1 = e => {
      console.log('say1', e);
      assert.equal(e, 1);
    };
    const handelr2 = e => {
      console.log('say2', e);
      assert.equal(e, 2);
      done();
    };
    tester.on('say', handelr1);
    tester.on('say', handelr2);
    tester.off('say', handelr1);
    tester.emit('say', 2);
  });

});