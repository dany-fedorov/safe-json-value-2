import safeJsonValue from '../src/main.js';

test.each([
  {
    descriptor: { configurable: false, writable: true },
    reason: 'descriptorNotConfigurable',
  },
  {
    descriptor: { configurable: true, writable: false },
    reason: 'descriptorNotWritable',
  },
])(`Make properties configurable and writable | %j`, ({ descriptor, reason }) => {
  // eslint-disable-next-line fp/no-mutating-methods
  const input = Object.defineProperty({}, 'prop', {
    value: true,
    enumerable: true,
    ...descriptor,
  });
  const { value, changes } = safeJsonValue(input);
  expect(value).toEqual({ prop: true });
  expect(Object.getOwnPropertyDescriptor(value, 'prop')).toEqual({
    value: true,
    enumerable: true,
    configurable: true,
    writable: true,
  });
  expect(changes).toEqual([{ path: ['prop'], oldValue: true, newValue: true, reason }]);
});

test.each([
  {
    input: {
      // eslint-disable-next-line fp/no-get-set
      get prop() {
        return true;
      },
    },
  },
  {
    input: {
      // eslint-disable-next-line fp/no-get-set
      get prop() {
        return true;
      },
      // eslint-disable-next-line fp/no-get-set
      set prop(_) {},
    },
  },
  {
    input: {
      // eslint-disable-next-line fp/no-get-set
      get prop() {
        // eslint-disable-next-line fp/no-mutating-methods, fp/no-this
        Object.defineProperty(this, 'prop', {
          value: true,
          enumerable: true,
          writable: true,
          configurable: true,
        });
        return true;
      },
    },
    title: 'selfModifyingProp',
  },
])(`Resolve getters | $title`, ({ input }) => {
  const { get } = Object.getOwnPropertyDescriptor(input, 'prop');
  expect(safeJsonValue(input)).toEqual({
    value: { prop: true },
    changes: [
      {
        path: ['prop'],
        oldValue: get,
        newValue: true,
        reason: 'unresolvedGetter',
      },
    ],
  });
});

test('Resolve setters without getters', () => {
  // eslint-disable-next-line fp/no-get-set, accessor-pairs
  const input = { set prop(_) {} };
  const change = { path: ['prop'], newValue: undefined, oldValue: undefined };
  expect(safeJsonValue(input)).toEqual({
    value: {},
    changes: [
      { ...change, reason: 'unresolvedGetter' },
      { ...change, reason: 'ignoredUndefined' },
    ],
  });
});

test('Omit getters that throw', () => {
  const error = new Error('test');
  // eslint-disable-next-line fp/no-mutating-methods
  const input = Object.defineProperty({}, 'prop', {
    get: () => {
      throw error.message;
    },
    enumerable: true,
    configurable: true,
  });
  expect(safeJsonValue(input)).toEqual({
    value: {},
    changes: [
      {
        path: ['prop'],
        oldValue: undefined,
        newValue: undefined,
        reason: 'unsafeGetter',
        error,
      },
    ],
  });
});

test('Resolve proxy get hooks', () => {
  // eslint-disable-next-line fp/no-proxy
  const input = new Proxy(
    { prop: false },
    {
      get: (...args) => {
        // Ensures the `value` returned by `safeJsonValue` is not a Proxy
        // anymore
        if (Reflect.get(...args)) {
          throw new Error('test');
        }

        return true;
      },
    },
  );
  expect(safeJsonValue(input)).toEqual({
    value: { prop: true },
    changes: [],
  });
});

test('Omit proxy get hooks that throw', () => {
  const error = new Error('test');
  // eslint-disable-next-line fp/no-proxy
  const input = new Proxy(
    { prop: true },
    {
      get: () => {
        throw error.message;
      },
    },
  );
  expect(safeJsonValue(input)).toEqual({
    value: {},
    changes: [
      {
        path: ['prop'],
        oldValue: undefined,
        newValue: undefined,
        error,
        reason: 'unsafeGetter',
      },
    ],
  });
});
