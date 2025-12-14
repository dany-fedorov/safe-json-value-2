import safeJsonValue from '../src/main.js';

const strings = [
  'test',
  '',
  // Backslash sequences
  '\n',
  '\0',
  // UTF-8 character
  '𝌆',
  // Valid UTF-8 sequences
  '\uD834\uDF06',
  // Invalid UTF-8 sequences
  '\uDF06\uD834',
  '\uDEAD',
];

test.each([
  {},
  [],
  true,
  false,
  null,
  0,
  // eslint-disable-next-line no-magic-numbers
  0.1,
  -0,
  -1,
  // eslint-disable-next-line no-magic-numbers
  1e60,
  // eslint-disable-next-line no-magic-numbers
  1e-60,
  ...strings,
])(`Applies options.maxSize on values | %#`, (input) => {
  const size = JSON.stringify(input).length;
  expect(safeJsonValue(input, { maxSize: size })).toEqual({
    value: input,
    changes: [],
  });
  expect(safeJsonValue(input, { maxSize: size - 1 })).toEqual({
    value: undefined,
    changes: [
      {
        path: [],
        oldValue: input,
        newValue: undefined,
        reason: 'unsafeSize',
      },
    ],
  });
});

test.each([...strings])(`Applies options.maxSize on properties | %#`, (key) => {
  const input = { one: true, [key]: true };
  const size = JSON.stringify(input).length;
  expect(safeJsonValue(input, { maxSize: size })).toEqual({
    changes: [],
    value: input,
  });
  expect(safeJsonValue(input, { maxSize: size - 1 })).toEqual({
    value: { one: true },
    changes: [
      {
        path: [key],
        oldValue: true,
        newValue: undefined,
        reason: 'unsafeSize',
      },
    ],
  });
});

const symbol = Symbol('test');
test.each([
  {
    input: { one: undefined, prop: true },
    output: { prop: true },
    key: 'one',
  },
  { input: [undefined, true], output: [true], key: 0 },
  {
    input: { [symbol]: undefined, prop: true },
    output: { prop: true },
    key: symbol,
    reason: 'ignoredSymbolKey',
  },
])(`Omitted values do not count towards options.maxSize | %#`, ({ input, output, key, reason = 'ignoredUndefined' }) => {
  const maxSize = JSON.stringify(output).length;
  expect(safeJsonValue(input, { maxSize })).toEqual({
    changes: [{ path: [key], oldValue: undefined, newValue: undefined, reason }],
    value: output,
  });
});

test.each([
  {
    input: { one: { two: { three: true, four: true } } },
    output: { one: { two: { three: true } } },
    path: ['one', 'two', 'four'],
  },
  {
    input: { one: { four: true, two: { three: true, four: true } } },
    output: { one: { four: true, two: { three: true } } },
    path: ['one', 'two', 'four'],
  },
])(`Applies options.maxSize in a depth-first manner | %#`, ({ input, output, path }) => {
  expect(safeJsonValue(input, { maxSize: JSON.stringify(output).length })).toEqual({
    value: output,
    changes: [{ path, oldValue: true, newValue: undefined, reason: 'unsafeSize' }],
  });
});

const error = new Error('test');
test.each([
  {
    input: { two: undefined },
    output: {},
    key: 'two',
    change: { reason: 'ignoredUndefined' },
  },
  {
    input: { one: true, two: undefined },
    output: { one: true },
    key: 'two',
    sizeIncrement: ','.length + JSON.stringify('two').length + ':'.length - 1,
    change: { reason: 'ignoredUndefined' },
  },
  {
    input: [undefined],
    output: [],
    key: 0,
    change: { reason: 'ignoredUndefined' },
    sizeChange: { reason: 'ignoredUndefined' },
  },
  {
    input: [1, undefined],
    output: [1],
    key: 1,
    sizeIncrement: ','.length - 1,
    change: { reason: 'ignoredUndefined' },
  },
  {
    // eslint-disable-next-line fp/no-mutating-methods
    input: Object.defineProperty({}, 'prop', {
      get: () => {
        throw error;
      },
      enumerable: true,
      configurable: true,
    }),
    output: {},
    key: 'prop',
    change: { reason: 'unsafeGetter', error },
    title: 'unsafeObjectProp',
  },
])(`Does not recurse if object property key, property comma or array comma is over options.maxSize | $title | %#`, ({ input, output, key, sizeIncrement = 0, change, sizeChange = {} }) => {
  expect(safeJsonValue(input)).toEqual({
    value: output,
    changes: [{ path: [key], oldValue: undefined, newValue: undefined, ...change }],
  });
  const maxSize = JSON.stringify(output).length + sizeIncrement;
  expect(safeJsonValue(input, { maxSize })).toEqual({
    value: output,
    changes: [
      {
        path: [key],
        oldValue: undefined,
        newValue: undefined,
        reason: 'unsafeSize',
        ...sizeChange,
      },
    ],
  });
});

const V8_MAX_STRING_LENGTH = 5e8;
const largeString = '\n'.repeat(V8_MAX_STRING_LENGTH);

test('Handles very large strings', () => {
  const maxSize = JSON.stringify({ one: '' }).length;
  expect(safeJsonValue({ one: largeString }, { maxSize })).toEqual({
    value: {},
    changes: [
      {
        path: ['one'],
        oldValue: largeString,
        newValue: undefined,
        reason: 'unsafeSize',
      },
    ],
  });
});

test('Handles very large object properties', () => {
  expect(safeJsonValue({ [largeString]: true }, { maxSize: 2 })).toEqual({
    value: {},
    changes: [
      {
        path: [largeString],
        oldValue: true,
        newValue: undefined,
        reason: 'unsafeSize',
      },
    ],
  });
});

test('Does not apply options.maxSize if infinite', () => {
  expect(safeJsonValue(largeString, { maxSize: Number.POSITIVE_INFINITY })).toEqual({ value: largeString, changes: [] });
});

test.each([undefined, { maxSize: undefined }])(`Applies options.maxSize by default | %#`, (options) => {
  expect(safeJsonValue(largeString, options)).toEqual({
    value: undefined,
    changes: [
      {
        path: [],
        oldValue: largeString,
        newValue: undefined,
        reason: 'unsafeSize',
      },
    ],
  });
});
