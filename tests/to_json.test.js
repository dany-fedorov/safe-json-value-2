import safeJsonValue from '../src/main.js';

test('Calls object.toJSON()', () => {
  const input = {
    toJSON: () => true,
  };
  const { value, changes } = safeJsonValue(input);
  expect(value).toBe(true);
  expect(changes).toEqual([{ path: [], oldValue: input, newValue: true, reason: 'unresolvedToJSON' }]);
});

test('Handles object.toJSON() returning undefined', () => {
  const input = { prop: { toJSON: () => {} } };
  const { value, changes } = safeJsonValue(input);
  expect(value).toEqual({});
  expect(changes).toEqual([
    {
      path: ['prop'],
      oldValue: input.prop,
      newValue: undefined,
      reason: 'unresolvedToJSON',
    },
    {
      path: ['prop'],
      oldValue: undefined,
      newValue: undefined,
      reason: 'ignoredUndefined',
    },
  ]);
});

test('Handles object.toJSON() that throws', () => {
  const error = new Error('test');
  const input = {
    toJSON: () => {
      throw error.message;
    },
  };
  const { value, changes } = safeJsonValue(input);
  expect(value).toBe(undefined);
  expect(changes).toEqual([
    {
      path: [],
      oldValue: input,
      newValue: undefined,
      reason: 'unsafeToJSON',
      error,
    },
    {
      path: [],
      oldValue: undefined,
      newValue: undefined,
      reason: 'ignoredUndefined',
    },
  ]);
});

test('Handles object.toJSON that are not functions', () => {
  const input = { toJSON: true };
  const { value, changes } = safeJsonValue(input);
  expect(value).toEqual(input);
  expect(changes).toEqual([]);
});

test('Handles dates', () => {
  const input = new Date();
  const newValue = input.toJSON();
  const { value, changes } = safeJsonValue(input);
  expect(value).toEqual(newValue);
  expect(changes).toEqual([{ path: [], oldValue: input, newValue, reason: 'unresolvedToJSON' }]);
});

test('Does not call object.toJSON() recursively', () => {
  const newValue = { toJSON: () => {}, prop: true };
  const input = { toJSON: () => newValue };
  const { value, changes } = safeJsonValue(input);
  expect(value).toEqual({ prop: true });
  expect(changes).toEqual([
    { path: [], oldValue: input, newValue, reason: 'unresolvedToJSON' },
    {
      path: ['toJSON'],
      oldValue: newValue.toJSON,
      newValue: undefined,
      reason: 'ignoredFunction',
    },
  ]);
});

const inputCallParent = {
  prop: {
    one: true,
    two: undefined,
    toJSON: () => safeJsonValue(inputCallParent).value,
  },
};

const inputCallSelfCopy = {
  prop: {
    one: true,
    two: undefined,
    toJSON: () => safeJsonValue({ ...inputCallSelfCopy }).value,
  },
};

const inputCallSelfRef = {
  one: true,
  two: undefined,
  toJSON: () => safeJsonValue(inputCallSelfRef).value,
};

test.each([inputCallParent, inputCallSelfCopy])(
  `Handles object.toJSON() that call the library itself with a parent or a copy | %#`,
  (input) => {
    const value = input.prop.toJSON();
    expect('two' in value.prop).toBe(false);
    expect('toJSON' in value.prop).toBe(false);
    expect(value).toEqual({ prop: { prop: { one: true } } });
  },
);

test('Handles object.toJSON() that calls the library itself', () => {
  const value = inputCallSelfRef.toJSON();
  expect('two' in value).toBe(false);
  expect('toJSON' in value).toBe(false);
  expect(value).toEqual({ one: true });
});
