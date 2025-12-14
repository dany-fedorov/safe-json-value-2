import safeJsonValue from 'safe-json-value-2';

test('Keep null prototypes', (t) => {
  const { value, changes } = safeJsonValue(Object.create(null));
  expect(value).toEqual({});
  expect(changes).toEqual([]);
  t.is(Object.getPrototypeOf(value), null);
});

test('Omit removed properties', (t) => {
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
  t.false('prop' in value);
});

test('Convert any objects to plain objects', (t) => {
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
