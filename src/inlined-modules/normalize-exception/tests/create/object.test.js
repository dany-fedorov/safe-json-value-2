import normalizeException from '../../src/main.js';

const { propertyIsEnumerable: isEnum } = Object.prototype;

test('Plain-objects errors can have names', () => {
  const name = 'Error';
  const error = normalizeException({ name });
  expect(error.name).toBe(name);
  expect(isEnum.call(error, 'name')).toBe(false);
  expect(error instanceof Error).toBe(true);
});

test('Plain-objects errors can re-use native error classes', () => {
  const name = 'TypeError';
  const error = normalizeException({ name });
  expect(error.name).toBe(name);
  expect(error instanceof TypeError).toBe(true);
});

test('Plain-objects errors can have stacks', () => {
  const message = 'test';
  const stack = `Error: ${message}\n  at here`;
  const error = normalizeException({ message, stack });
  expect(error.stack).toBe(stack);
  expect(isEnum.call(error, 'stack')).toBe(false);
});

test('Plain-objects errors without stacks get one', () => {
  const { stack } = normalizeException({});
  expect(stack.includes('Error')).toBe(true);
  expect(stack.includes('{}')).toBe(true);
});

test('Plain-objects errors without stacks get one based on object', () => {
  const { stack } = normalizeException({ name: 'TypeError', message: 'test' });
  expect(stack.includes('TypeError')).toBe(true);
  expect(stack.includes('test')).toBe(true);
});

test('Plain-objects errors can have causes', () => {
  const cause = new Error('test');
  const error = normalizeException({ cause });
  expect(error.cause).toBe(cause);
  expect(isEnum.call(error, 'cause')).toBe(false);
});

test('Plain-objects errors can have aggregate errors', () => {
  const errors = [new Error('test')];
  const error = normalizeException({ errors });
  expect(error.errors).toEqual(errors);
  expect(isEnum.call(error, 'errors')).toBe(false);
});

test('Plain-objects errors can have static properties', () => {
  expect(normalizeException({ message: 'test', prop: true }).prop).toBe(true);
});

test('Plain-objects errors can have messages', () => {
  const message = 'test';
  const error = normalizeException({ message });
  expect(error.message).toBe(message);
  expect(isEnum.call(error, 'message')).toBe(false);
});

test.each(['', true])(`Plain-objects errors cannot have invalid messages | %#`, (message) => {
  expect(normalizeException({ message }).message).toBe('{}');
});

test('Plain-objects errors without messages are serialized', () => {
  const exception = { prop: true };
  expect(normalizeException(exception).message).toBe(JSON.stringify(exception));
});

test('Plain-objects errors without messages are serialized even with recursion', () => {
  const exception = { prop: true };
  // eslint-disable-next-line fp/no-mutation
  exception.self = exception;
  const error = normalizeException(exception);
  expect(error.message).toBe(String({}));
});

const throwError = () => {
  throw new Error('test');
};

test('Plain-objects errors without messages are serialized even with unsafe fields', () => {
  const exception = {
    one: true,
    two: { toJSON: throwError },
    // eslint-disable-next-line fp/no-get-set
    get three() {
      throw new Error('test');
    },
  };
  expect(normalizeException(exception).message).toBe(String({}));
});

test('Plain-objects errors without messages are serialized even with top-level unsafe fields', () => {
  const exception = { toJSON: throwError };
  expect(normalizeException(exception).message).toBe(String({}));
});

test('Plain-objects errors without messages are serialized even with invalid toString()', () => {
  const exception = { one: true, two: 0n, toString: throwError };
  expect(normalizeException(exception).message).toBe('Invalid error');
});

test('Plain-objects errors without messages but with bigints are serialized', () => {
  const exception = { one: true, two: 0n };
  expect(normalizeException(exception).message).toBe(String({}));
});

test('Plain-objects errors without messages but with long fields are serialized', () => {
  const exception = { one: true, two: 'a'.repeat(BIG_STRING_LENGTH) };
  const { message } = normalizeException(exception);
  expect(message.includes('one')).toBe(true);
  expect(message.length < BIG_STRING_LENGTH).toBe(true);
});

const BIG_STRING_LENGTH = 1e6;
