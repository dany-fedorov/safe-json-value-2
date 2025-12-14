import safeJsonValue from '../src/main.js';

test('Omit circular values', () => {
  const input = {};
  // eslint-disable-next-line fp/no-mutation
  input.self = input;
  const { value, changes } = safeJsonValue(input);
  expect('self' in value).toBe(false);
  expect(changes).toEqual([
    {
      path: ['self'],
      oldValue: input,
      newValue: undefined,
      reason: 'unsafeCycle',
    },
  ]);
});
