import normalizeException from '../../src/main.js';

test.each([undefined, null, true, 0, 0n, '', 'test', Symbol('test'), Object.create({}), new Set([])])(`Handle non-plain-objects errors | %#`, (exception) => {
  const error = normalizeException(exception);
  expect(error instanceof Error).toBe(true);
  const message = String(exception);
  expect(error.message).toBe(message);
  expect(error.stack.includes('Error')).toBe(true);
  expect(error.stack.includes(message)).toBe(true);
});

test('Handle exceptions with invalid toString()', () => {
  const exception = Object.create({
    toString: () => {
      throw new Error('test');
    },
  });
  const error = normalizeException(exception);
  expect(error instanceof Error).toBe(true);
  expect(error.message).toBe('test');
  expect(error.stack.includes('toString')).toBe(true);
});

test('Handle unextensible errors', () => {
  const error = new TypeError('test');
  // eslint-disable-next-line fp/no-delete
  delete error.message;
  Object.preventExtensions(error);
  const errorA = normalizeException(error);
  expect(errorA instanceof TypeError).toBe(true);
  expect(error.message).toBe('');
});
