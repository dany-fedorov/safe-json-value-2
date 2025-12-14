import safeJsonValue from 'safe-json-value-2';

const valueTestCases = [
  { value: () => {}, reason: 'ignoredFunction' },
  { value: Symbol('test'), reason: 'ignoredSymbolValue' },
  { value: undefined, reason: 'ignoredUndefined' },
  { value: 0n, reason: 'unsafeBigInt' },
  { value: Number.NaN, reason: 'unstableInfinite' },
  { value: Number.POSITIVE_INFINITY, reason: 'unstableInfinite' },
  { value: Number.NEGATIVE_INFINITY, reason: 'unstableInfinite' },
];

const inputCases = [
  { getInput: (value) => value, output: undefined, change: { path: [] } },
  {
    getInput: (value) => ({ prop: value }),
    output: {},
    change: { path: ['prop'] },
  },
];

const combinedCases = valueTestCases.flatMap((valueCase) =>
  inputCases.map((inputCase) => ({ ...valueCase, ...inputCase })),
);

test.each(combinedCases)(`Omit invalid types | $reason | %#`, ({ value, reason, getInput, output, change }) => {
  const input = getInput(value);
  expect(safeJsonValue(input)).toEqual({
    value: output,
    changes: [{ ...change, oldValue: value, newValue: undefined, reason }],
  });
});
