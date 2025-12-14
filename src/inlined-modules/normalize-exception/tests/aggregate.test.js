import { runInNewContext } from 'node:vm';

import normalizeException from '../src/main.js';

const { propertyIsEnumerable: isEnum } = Object.prototype;

test.each([true, false])(`Fix invalid error.errors to non-AggregateError | %s`, (shallow) => {
  const error = new Error('test');
  const innerError = 'inner';
  error.errors = innerError;
  const errorA = normalizeException(error, { shallow });
  expect('errors' in errorA).toBe(false);
});

if ('AggregateError' in globalThis) {
  test.each([true, false])(`Add missing error.errors to AggregateError | %s`, (shallow) => {
    const error = new AggregateError([], 'test');
    // eslint-disable-next-line fp/no-delete
    delete error.errors;
    expect('errors' in error).toBe(false);
    const errorA = normalizeException(error, { shallow });
    expect(errorA.errors).toEqual([]);
  });

  test.each([true, false])(`Add missing error.errors to AggregateError in different realms | %s`, (shallow) => {
    const CustomAggregateError = runInNewContext('AggregateError');
    const error = new CustomAggregateError([], 'test');
    // eslint-disable-next-line fp/no-delete
    delete error.errors;
    expect(normalizeException(error, { shallow }).errors).toEqual([]);
  });

  test.each([true, false])(`Add missing error.errors to AggregateError even if inherited | %s`, (shallow) => {
    // eslint-disable-next-line fp/no-class
    class ChildError extends Error {}
    // eslint-disable-next-line fp/no-mutation
    ChildError.prototype.errors = '';
    const error = new ChildError('test');
    expect(error.errors).toBe('');
    const errorA = normalizeException(error, { shallow });
    expect(errorA.errors).toEqual([]);
  });

  test.each([true, false])(`Fix invalid error.errors to AggregateError | %s`, (shallow) => {
    const error = new AggregateError([], 'test');
    error.errors = new Error('test');
    const errorA = normalizeException(error, { shallow });
    expect(errorA.errors).toEqual([]);
  });

  test.each([true, false])(`Ignore undefined error.errors to AggregateError | %s`, (shallow) => {
    const innerError = new Error('inner');
    const error = new AggregateError([undefined, innerError], 'test');
    const errorA = normalizeException(error, { shallow });
    expect(errorA.errors).toEqual([innerError]);
  });
} else {
  test.each([true, false])(`Plain-objects AggregateError do not work in older environments | %s`, (shallow) => {
    const errorA = normalizeException({ name: 'AggregateError', message: 'test' }, { shallow });
    expect(errorA.name).toBe('AggregateError');
    expect(errorA.constructor).toBe(Error);
  });
}

if ('AggregateError' in globalThis) {
  test('Normalize error.errors in AggregateError', () => {
    const innerError = 'inner';
    const error = new AggregateError([innerError], 'test');
    const errorA = normalizeException(error);
    expect(isEnum.call(errorA, 'errors')).toBe(false);
    expect(errorA.errors[0] instanceof Error).toBe(true);
    expect(errorA.errors[0].message).toBe(innerError);
  });

  test('Handle infinite error.errors', () => {
    const error = new AggregateError(['test'], 'test');
    error.errors[1] = error;
    const errorA = normalizeException(error);
    expect(errorA.errors.length).toBe(1);
  });

  test('Plain-objects errors remain the same', () => {
    const innerError = new Error('inner');
    const error = new AggregateError([innerError], 'test', {
      cause: new Error('cause'),
    });
    error.prop = true;
    const { name, message, stack, cause, errors, ...props } = error;
    const errorObj = { ...props, name, message, stack, cause, errors };
    const errorA = normalizeException(errorObj);
    expect(errorA).toEqual(error);
    expect(stack.includes(errorA.stack)).toBe(true);
    expect(errorA.cause).toBe(cause);
    expect(errorA.errors).toEqual(errors);
  });
}

test('Normalize error.errors in non-AggregateError', () => {
  const error = new Error('test');
  const innerError = 'inner';
  error.errors = [innerError];
  const errorA = normalizeException(error);
  expect(errorA.errors[0].message).toBe(innerError);
});

test('Does not normalize error.errors if shallow', () => {
  const error = new Error('test');
  const innerError = 'inner';
  error.errors = [innerError];
  const errorA = normalizeException(error, { shallow: true });
  expect(errorA.errors[0]).toBe(innerError);
});
