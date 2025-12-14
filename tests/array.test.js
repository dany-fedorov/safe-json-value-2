import safeJsonValue from 'safe-json-value-2';

test('Omit removed properties', (t) => {
  expect(safeJsonValue([0, undefined, 1])).toEqual({
    value: [0, 1],
    changes: [
      {
        path: [1],
        oldValue: undefined,
        newValue: undefined,
        reason: 'ignoredUndefined',
      },
    ],
  });
});
