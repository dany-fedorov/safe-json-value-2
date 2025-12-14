import safeJsonValue from 'safe-json-value-2';

const symbol = Symbol('test');
test.each([
  {
    input: { [symbol]: true },
    output: {},
    changes: [
      {
        path: [symbol],
        oldValue: true,
        newValue: undefined,
        reason: 'ignoredSymbolKey',
      },
    ],
  },
  {
    // eslint-disable-next-line fp/no-mutating-methods
    input: Object.defineProperty({}, 'prop', {
      value: true,
      enumerable: false,
      writable: true,
      configurable: true,
    }),
    output: {},
    changes: [
      {
        path: ['prop'],
        oldValue: true,
        newValue: undefined,
        reason: 'ignoredNotEnumerable',
      },
    ],
  },
  {
    // eslint-disable-next-line fp/no-mutating-methods
    input: Object.defineProperty([], '0', {
      value: true,
      enumerable: false,
      writable: true,
      configurable: true,
    }),
    output: [true],
    changes: [],
  },
])(`Omit invalid keys | %#`, ({ input, output, changes }) => {
  expect(safeJsonValue(input)).toEqual({ value: output, changes });
});
