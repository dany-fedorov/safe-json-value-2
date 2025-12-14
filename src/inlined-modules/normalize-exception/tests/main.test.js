import { runInNewContext } from 'node:vm';

import normalizeException from '../src/main.js';

const { propertyIsEnumerable: isEnum } = Object.prototype;

test('Normal errors are left as is', () => {
  const error = new TypeError('test');
  const errorString = error.toString();
  const errorA = normalizeException(error);
  expect(errorA instanceof TypeError).toBe(true);
  expect(errorA.toString()).toBe(errorString);
});

test('Cross-realm errors are left as is', () => {
  const CrossTypeError = runInNewContext('TypeError');
  const error = new CrossTypeError('test');
  const errorA = normalizeException(error);
  expect(errorA).toBe(error);
  expect(errorA instanceof CrossTypeError).toBe(true);
});

test.each([undefined, true, ''])(`Fix invalid error.name | %#`, (value) => {
  const error = new TypeError('test');
  error.name = value;
  expect(normalizeException(error).name).toBe('TypeError');
  expect(isEnum.call(error, 'name')).toBe(false);
});

test.each([undefined, true, ''])(`Fix invalid error.message | %#`, (value) => {
  const error = new Error('test');
  error.message = value;
  expect(normalizeException(error).message).toBe('');
  expect(isEnum.call(error, 'message')).toBe(false);
});

test.each([undefined, true, ''])(`Fix invalid error.stack | %#`, (value) => {
  const error = new Error('test');
  error.stack = value;
  expect(normalizeException(error).stack.includes('test')).toBe(true);
  expect(isEnum.call(error, 'stack')).toBe(false);
});

test.serial('Fix invalid error.name without constructor names', () => {
  const error = new TypeError('test');
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(TypeError, 'name', { value: '' });
  error.name = '';
  expect(normalizeException(error).name).toBe('Error');
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(TypeError, 'name', { value: 'TypeError' });
});

test('Does not fix error.name not matching constructor names', () => {
  const error = new TypeError('test');
  error.name = 'Error';
  expect(normalizeException(error).name).toBe('Error');
});

// eslint-disable-next-line fp/no-class
class TestError extends Error {}
// eslint-disable-next-line fp/no-mutation
TestError.prototype.name = 'OtherError';

test('Prefer prototype.name over constructor.name', () => {
  const error = new TestError('test');
  error.name = '';
  expect(normalizeException(error).name).toBe('OtherError');
});

// eslint-disable-next-line fp/no-class
class InvalidError extends Error {}
// eslint-disable-next-line fp/no-mutation
InvalidError.prototype.name = '';

test('Fallback to constructor.name', () => {
  const error = new InvalidError('test');
  error.name = '';
  expect(normalizeException(error).name).toBe('InvalidError');
});
