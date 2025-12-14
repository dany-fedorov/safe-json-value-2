import safeJsonValue from '../src/main.js';

test('Keep null prototypes', () => {
  const { value, changes } = safeJsonValue(Object.create(null));
  expect(value).toEqual({});
  expect(changes).toEqual([]);
  expect(Object.getPrototypeOf(value)).toBe(null);
});

test('Omit removed properties', () => {
  const { value, changes } = safeJsonValue({ prop: undefined });
  expect(value).toEqual({});
  expect(changes).toEqual([
    {
      path: ['prop'],
      oldValue: undefined,
      newValue: undefined,
      reason: 'ignoredUndefined',
    },
  ]);
  expect('prop' in value).toBe(false);
});

test('Convert any objects to plain objects', () => {
  const set = new Set([]);
  // eslint-disable-next-line fp/no-mutation
  set.prop = true;
  expect(safeJsonValue(set)).toEqual({
    value: { prop: true },
    changes: [
      {
        path: [],
        oldValue: set,
        newValue: { prop: true },
        reason: 'unresolvedClass',
      },
    ],
  });
});
