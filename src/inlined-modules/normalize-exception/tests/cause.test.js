import normalizeException from '../src/main.js';

const { propertyIsEnumerable: isEnum } = Object.prototype;

const hasErrorCause = () => {
  const { cause } = new Error('test', { cause: true });
  return cause === true;
};

if (hasErrorCause()) {
  test('Normalize error.cause', () => {
    const cause = 'inner';
    const error = new Error('test', { cause });
    const errorA = normalizeException(error);
    expect(errorA.cause instanceof Error).toBe(true);
    expect(isEnum.call(errorA, 'cause')).toBe(false);
    expect(errorA.cause.message).toBe(cause);
  });

  test('Does not normalize error.cause if shallow', () => {
    const cause = 'inner';
    const error = new Error('test', { cause });
    const errorA = normalizeException(error, { shallow: true });
    expect(errorA.cause).toBe(cause);
  });

  test.each([true, false])(`Delete normalize error.cause undefined | %s`, (shallow) => {
    const error = new Error('test', { cause: undefined });
    const errorA = normalizeException(error, { shallow });
    expect('cause' in errorA).toBe(false);
  });
}

test('Handle infinite error.cause', () => {
  const error = new Error('test');
  error.cause = error;
  const errorA = normalizeException(error);
  expect('cause' in errorA).toBe(false);
});
