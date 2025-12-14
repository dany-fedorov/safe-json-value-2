import safeJsonValue from '../src/main.js';

const isProp = (key) => key.startsWith('prop');

const getInfiniteGetter = () => ({
  // eslint-disable-next-line fp/no-get-set
  get prop() {
    return getInfiniteGetter();
  },
});

const getInfiniteToJSON = () => ({
  prop: true,
  toJSON: () => ({ prop: getInfiniteToJSON() }),
});

const getInfiniteToJSONTwo = () => ({
  toJSON: () => ({ prop: true, propTwo: getInfiniteToJSONTwo() }),
});

test.each([{ getInput: getInfiniteGetter }, { getInput: getInfiniteToJSON }, { getInput: getInfiniteToJSONTwo }])(
  `Handle dynamic infinite functions | %#`,
  ({ getInput }) => {
    const input = getInput();
    const { value, changes } = safeJsonValue(input);
    expect('prop' in value).toBe(true);
    const lastChange = changes.at(-1);
    expect(Array.isArray(lastChange.path) && lastChange.path.every(isProp)).toBe(true);
    expect(typeof lastChange.oldValue).toBe('object');
    expect(lastChange.newValue).toBe(undefined);
    expect(lastChange.reason).toBe('unsafeException');
  },
);
