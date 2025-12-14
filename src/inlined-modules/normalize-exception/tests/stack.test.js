import normalizeException from '../src/main.js';

const { propertyIsEnumerable: isEnum } = Object.prototype;

test('Create a new stack on non-errors', () => {
  expect(typeof normalizeException().stack).toBe('string');
});

test('New stack is not enumerable', () => {
  expect(isEnum.call(normalizeException(), 'stack')).toBe(false);
});

test('New stack includes name and message', () => {
  const { name, message, stack } = normalizeException();
  expect(stack.includes(name)).toBe(true);
  expect(stack.includes(message)).toBe(true);
});

test('New stack includes internal code', () => {
  const { stack } = normalizeException();
  expect(stack.includes('normalize-exception')).toBe(true);
});

test('New stack with prepareStackTrace()', () => {
  const message = '\ntest';
  // eslint-disable-next-line fp/no-mutation
  Error.prepareStackTrace = () => message;
  expect(normalizeException('test').stack).toBe(message);
  // eslint-disable-next-line fp/no-delete
  delete Error.prepareStackTrace;
});

test('New stack with prepareStackTrace() empty', () => {
  // eslint-disable-next-line fp/no-mutation
  Error.prepareStackTrace = () => '';
  expect(normalizeException('test').stack).toBe('Error: test');
  // eslint-disable-next-line fp/no-delete
  delete Error.prepareStackTrace;
});

test('New stack with prepareStackTrace() not a string', () => {
  // eslint-disable-next-line fp/no-mutation
  Error.prepareStackTrace = () => true;
  expect(normalizeException('test').stack).toBe('Error: test');
  // eslint-disable-next-line fp/no-delete
  delete Error.prepareStackTrace;
});

test('New stack with stackTraceLimit 0', () => {
  const { stackTraceLimit } = Error;
  // eslint-disable-next-line fp/no-mutation
  Error.stackTraceLimit = 0;
  expect(normalizeException('test').stack).toBe('Error: test');
  // eslint-disable-next-line fp/no-mutation
  Error.stackTraceLimit = stackTraceLimit;
});

test('New stack with stackTraceLimit undefined', () => {
  const { stackTraceLimit } = Error;
  // eslint-disable-next-line fp/no-delete
  delete Error.stackTraceLimit;
  expect(normalizeException('test').stack).toBe('Error: test');
  // eslint-disable-next-line fp/no-mutation
  Error.stackTraceLimit = stackTraceLimit;
});

test('Keeps prefixed header in error.stack', () => {
  const error = new TypeError('test');
  const stack = `Test\n${error.stack}`;
  error.stack = stack;
  expect(normalizeException(error).stack).toBe(stack);
});
