import safeJsonValue from 'safe-json-value-2';

test('Omit circular values', (t) => {
  const input = {};
  // eslint-disable-next-line fp/no-mutation
  input.self = input;
  const { value, changes } = safeJsonValue(input);
  t.false('self' in value);
  expect(changes).toEqual([
    {
      path: ['self'],
      oldValue: input,
      newValue: undefined,
      reason: 'unsafeCycle',
    },
  ]);
});
