import { runInNewContext } from 'node:vm';

import normalizeException from '../../src/main.js';

const { toString: objectToString } = Object.prototype;

test('Plain-objects errors work cross-realm', () => {
  const props = runInNewContext('({ name: "TypeError" })');
  const error = normalizeException(props);
  expect(error.name).toBe('TypeError');
  expect(error instanceof TypeError).toBe(true);
});

const constructorWithoutName = () => {};
// eslint-disable-next-line fp/no-mutating-methods
Object.defineProperty(constructorWithoutName, 'name', { value: false });
const constructorWithEmptyName = () => {};
// eslint-disable-next-line fp/no-mutating-methods
Object.defineProperty(constructorWithEmptyName, 'name', { value: '' });
const constructorWithFakeName = () => {};
// eslint-disable-next-line fp/no-mutating-methods
Object.defineProperty(constructorWithFakeName, 'name', { value: 'Error' });
test.each(['', constructorWithoutName, constructorWithEmptyName, constructorWithFakeName])(`Plain-objects with errors with wrong constructor | %#`, (errorConstructor) => {
  const message = 'test';
  const error = new Error(message);
  error.constructor = errorConstructor;
  const errorA = normalizeException(error);
  expect(errorA.message).toBe(message);
  expect(errorA.constructor).toBe(Error);
});

test('Handle proxies', () => {
  const message = 'test';
  // eslint-disable-next-line fp/no-proxy
  const proxy = new Proxy(new Error(message), {});
  const error = normalizeException(proxy);
  expect(error instanceof Error).toBe(true);
  expect(objectToString.call(error)).toBe('[object Error]');
  expect(error.message).toBe(message);
});

const invalidProxyHook = () => {
  throw new Error('proxyError');
};

test.each([
  'set',
  'get',
  'deleteProperty',
  'has',
  'ownKeys',
  'defineProperty',
  'getOwnPropertyDescriptor',
  'isExtensible',
  'preventExtensions',
  'getPrototypeOf',
  'setPrototypeOf',
  'apply',
  'construct',
])(`Handle throwing Proxy.get | %s`, (hook) => {
  const error = new Error('test');
  // eslint-disable-next-line fp/no-proxy
  const proxy = new Proxy(error, { [hook]: invalidProxyHook });
  expect(typeof normalizeException(proxy).message).toBe('string');
});
