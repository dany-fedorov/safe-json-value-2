import normalizeException from '../src/main.js';

const { propertyIsEnumerable: isEnum } = Object.prototype;

test('Handles non-enumerable inherited error properties', () => {
  // eslint-disable-next-line fp/no-class
  class TestError extends Error {}
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(TestError.prototype, 'name', {
    value: TestError.name,
    writable: true,
    enumerable: true,
    configurable: true,
  });
  expect(isEnum.call(TestError.prototype, 'name')).toBe(true);
  const error = new TestError('test');
  expect(Object.hasOwn(error, 'name')).toBe(false);
  expect(isEnum.call(Object.getPrototypeOf(error), 'name')).toBe(true);
  const normalizedError = normalizeException(error);
  expect(Object.hasOwn(normalizedError, 'name')).toBe(true);
  expect(isEnum.call(normalizedError, 'name')).toBe(false);
});

test('Handles non-enumerable getters', () => {
  const error = new Error('test');
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(error, 'message', {
    get: getMessage,
    set: setMessage,
    enumerable: true,
    configurable: true,
  });
  expect(error.message).toBe('testTwo');
  expect(isEnum.call(error, 'message')).toBe(true);
  const normalizedError = normalizeException(error);
  expect(normalizedError.message).toBe('testTwo');
  expect(isEnum.call(normalizedError, 'message')).toBe(false);
  expect(Object.getOwnPropertyDescriptor(normalizedError, 'message').get).toBe(getMessage);
});

test('Handles readonly getters', () => {
  const error = new Error('test');
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(error, 'message', {
    get: getMessage,
    enumerable: true,
    configurable: true,
  });
  expect(error.message).toBe('testTwo');
  const normalizedError = normalizeException(error);
  expect(Object.getOwnPropertyDescriptor(normalizedError, 'message').value).toBe('testTwo');
});

const getMessage = () => 'testTwo';

const setMessage = () => {};

test.each([
  { propName: 'lineNumber', enumerable: false },
  { propName: 'columnNumber', enumerable: false },
  { propName: 'fileName', enumerable: false },
  { propName: 'line', enumerable: true },
  { propName: 'column', enumerable: true },
])(`Non-standard error properties are left as is | $propName`, ({ propName, enumerable }) => {
  const error = new Error('test');
  const value = 0;
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(error, propName, {
    value,
    enumerable,
    writable: true,
    configurable: true,
  });
  const normalizedError = normalizeException(error);
  expect(normalizedError[propName]).toBe(value);
  expect(Object.getOwnPropertyDescriptor(normalizedError, propName).enumerable).toBe(enumerable);
});
