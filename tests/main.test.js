import safeJsonValue from '../src/main.js';

test('Is deep by default on objects', () => {
  expect(safeJsonValue({ one: 0n }).value).toEqual({});
});

test('Is deep by default on arrays', () => {
  expect(safeJsonValue([0n]).value).toEqual([]);
});

test('Can be shallow on objects', () => {
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

test('Can be shallow on arrays', () => {
  const value = [0n];
  expect(safeJsonValue(value, { shallow: true }).value).toEqual(value);
});

test('Can be shallow on non-objects nor arrays', () => {
  expect(safeJsonValue(0n, { shallow: true }).value).toBe(undefined);
});
