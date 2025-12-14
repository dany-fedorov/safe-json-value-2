import safeJsonValue from '../src/main.js';

test('Omit removed properties', () => {
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
