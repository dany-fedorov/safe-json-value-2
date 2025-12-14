import safeJsonValue from '../src/main.js';

const keys = ['prop', Symbol('test')];
const enumerableValues = [true, false];
const descriptorCases = [
  { descriptor: { value: true, writable: true }, oldValue: true },
  {
    descriptor: {
      get: () => {
        throw new Error('test');
      },
    },
    oldValue: undefined,
  },
];

const combinedCases = keys.flatMap((key) =>
  enumerableValues.flatMap((enumerable) =>
    descriptorCases.map((descriptorCase) => ({
      key,
      enumerable,
      ...descriptorCase,
    })),
  ),
);

test.each(combinedCases)(
  `Omit array properties that are not indices | %#`,
  ({ key, enumerable, descriptor, oldValue }) => {
    // eslint-disable-next-line fp/no-mutating-methods
    const array = Object.defineProperty([true], key, {
      ...descriptor,
      enumerable,
      configurable: true,
    });
    const { value, changes } = safeJsonValue(array);
    expect(value[0]).toBe(true);
    expect(key in value).toBe(false);
    expect(changes).toEqual([
      {
        path: [key],
        oldValue,
        newValue: undefined,
        reason: 'ignoredArrayProperty',
      },
    ]);
  },
);
