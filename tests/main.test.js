import safeJsonValue from '../dist/main';

test('Is deep by default on objects', (t) => {
  expect(safeJsonValue({ one: 0n }).value).toEqual({});
});

test('Is deep by default on arrays', (t) => {
  expect(safeJsonValue([0n]).value).toEqual([]);
});

test('Can be shallow on objects', (t) => {
  const value = { one: 0n };
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(value, 'two', {
    value: true,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  expect(safeJsonValue(value, { shallow: true }).value).toEqual({ one: 0n });
});

test('Can be shallow on arrays', (t) => {
  const value = [0n];
  expect(safeJsonValue(value, { shallow: true }).value).toEqual(value);
});

test('Can be shallow on non-objects nor arrays', (t) => {
  t.is(safeJsonValue(0n, { shallow: true }).value, undefined);
});
