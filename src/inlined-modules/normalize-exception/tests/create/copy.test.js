import normalizeException from '../../src/main.js';

const setInvalidProp = (propName) =>
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(new Error('test'), propName, { get: invalidGet });

const invalidGet = () => {
  throw new Error('getterError');
};

test('Handle throwing getters on name', () => {
  expect(normalizeException(setInvalidProp('name')).name).toBe('Error');
});

test('Handle throwing getters on message', () => {
  expect(normalizeException(setInvalidProp('message')).message).toBe('{}');
});

test('Handle throwing getters on stack', () => {
  const error = normalizeException(setInvalidProp('stack'));
  expect(error.stack.includes(error.toString())).toBe(true);
});

test('Handle throwing getters on cause', () => {
  expect(normalizeException(setInvalidProp('cause')).cause).toBe(undefined);
});

test('Handle throwing getters on aggregate errors', () => {
  expect(normalizeException(setInvalidProp('errors')).errors).toBe(undefined);
});

test('Handle throwing getters on plain objects', () => {
  expect(
    normalizeException({
      // eslint-disable-next-line fp/no-get-set
      get name() {
        throw new Error('getterError');
      },
    }).name,
  ).toBe('Error');
});

test('Plain-objects errors ignore non-enumerable static properties', () => {
  expect(
    normalizeException(
      // eslint-disable-next-line fp/no-mutating-methods
      Object.defineProperty({ message: 'test' }, 'prop', {
        value: true,
        enumerable: false,
      }),
    ).prop,
  ).toBe(undefined);
});

test('Plain-objects errors do not ignore non-enumerable core properties', () => {
  const name = 'TypeError';
  expect(
    normalizeException(
      // eslint-disable-next-line fp/no-mutating-methods
      Object.defineProperty({ message: 'test' }, 'name', {
        value: name,
        enumerable: false,
      }),
    ).name,
  ).toBe(name);
});

// eslint-disable-next-line fp/no-class
class ChildError extends Error {}
// eslint-disable-next-line fp/no-mutating-methods
Object.defineProperty(ChildError.prototype, 'message', { value: 'test' });
// eslint-disable-next-line fp/no-mutating-methods
Object.defineProperty(ChildError.prototype, 'prop', { value: true });

test('Plain-objects errors ignore inherited static properties', () => {
  const error = new ChildError();
  Object.preventExtensions(error);
  expect(error.prop).toBe(true);
  expect(normalizeException(error).prop).toBe(undefined);
});

test('Plain-objects errors do not ignore inherited core properties', () => {
  const error = new ChildError();
  Object.preventExtensions(error);
  expect(error.message).toBe('test');
  expect(normalizeException(error).message).toBe('test');
});
