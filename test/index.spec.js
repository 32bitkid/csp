const test = require('tape');
const csp = require('../');
const { channel, put, take, alts, select, drain } = csp;

const msg = (() => {
  let i = 0;
  return () => ++i;
})();

test('[csp] methods', t => {
  t.ok(csp, 'csp should be defined');
  t.ok(csp.channel, 'csp.channel should be defined');
  t.ok(csp.put, 'csp.put should be defined');
  t.ok(csp.take, 'csp.take should be defined');
  t.ok(csp.alts, 'csp.alts should be defined');
  t.ok(csp.select, 'csp.select should be defined');
  t.ok(csp.drain, 'csp.drain should be defined');
  t.end();
});

test('[csp] channel', t => {
  const chan = channel();
  t.equal(Object.getOwnPropertySymbols(chan).length, 4, 'should contain 4 symbol properties');
  t.equal(Object.keys(chan).length, 0, 'should not expose properties normally');
  t.end();
});

test('[csp] put', t => {
  const chan = channel();
  const res = put(chan, 'foo');
  t.ok(res instanceof Promise, 'should return an instance of a Promise');
  t.end();
});

test('[csp] take', t => {
  const chan = channel();
  const res = take(chan);
  t.ok(res instanceof Promise, 'should return an instance of a Promise');
  t.end();
});

test('[csp] alts', t => {
  const chan1 = channel();
  const chan2 = channel();
  const res = alts(chan1, chan2);
  t.ok(res instanceof Promise, 'should return an instance of a Promise');
  t.end();
});

test('[csp] drain', async t => {
  const chan = channel();
  const messages = [ msg(), msg(), msg(), msg(), msg() ];
  messages.forEach(m => put(chan, m));
  const res = drain(chan);
  t.ok(res instanceof Promise, 'should return an instance of a Promise');
  const result = await res;
  t.deepEqual(result, messages, 'should drain the channel');
  t.end();
});

test('[csp] take, already put', async t => {
  const chan = channel();
  const m = msg();
  put(chan, m);
  const res = await take(chan);
  t.equal(res, m, 'should resolve the correct value');
  t.end();
});

test('[csp] put, already taking', async t => {
  const chan = channel();
  const m = msg();
  const result = take(chan);
  await put(chan, m);
  const res = await result;
  t.equal(res, m, 'should resolve the correct value');
  t.end();
});

test('[csp] alts, chan1 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const result = alts(chan1, chan2);
  await put(chan1, m);
  const res = await result;
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] alts, chan2 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const putter = put(chan2, m);
  const result = alts(chan1, chan2);
  await putter;
  const res = await result;
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] select Array, chan1 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const result = select([chan1, chan2]);
  await put(chan1, m);
  const [id, res] = await result;
  t.equal(id, 0, 'should receive the correct id');
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] select Array, chan2 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const putter = put(chan2, m);
  const result = select([chan1, chan2]);
  await putter;
  const [id, res] = await result;
  t.equal(id, 1, 'should receive the correct id');
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] select Map, chan1 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const key1 = Symbol();
  const key2 = Symbol();
  const result = select(new Map([[key1, chan1], [key2, chan2]]));
  await put(chan1, m);
  const [id, res] = await result;
  t.equal(id, key1, 'should receive the correct id');
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] select Map, chan2 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const putter = put(chan2, m);
  const key1 = Symbol();
  const key2 = Symbol();
  const result = select(new Map([[key1, chan1], [key2, chan2]]));
  await putter;
  const [id, res] = await result;
  t.equal(id, key2, 'should receive the correct id');
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] select Object, chan1 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const result = select({ a: chan1, b: chan2 });
  await put(chan1, m);
  const [id, res] = await result;
  t.equal(id, 'a', 'should receive the correct id');
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] select Object, chan2 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const putter = put(chan2, m);
  const result = select({ a: chan1, b: chan2 });
  await putter;
  const [id, res] = await result;
  t.equal(id, 'b', 'should receive the correct id');
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] select Set, chan1 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const result = select(new Set([chan1, chan2]));
  await put(chan1, m);
  const [id, res] = await result;
  t.equal(id, chan1, 'should receive the correct id');
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

test('[csp] select Set, chan2 ready', async t => {
  const chan1 = channel();
  const chan2 = channel();
  const m = msg();
  const putter = put(chan2, m);
  const result = select(new Set([chan1, chan2]));
  await putter;
  const [id, res] = await result;
  t.equal(id, chan2, 'should receive the correct id');
  t.equal(res, m, 'should receive the correct value');
  t.end();
});

