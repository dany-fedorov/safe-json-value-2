import normalizeException from '../../src/main.js';

const propCases = [
  { propName: 'name', value: 'TestError' },
  { propName: 'message', value: 'test' },
  { propName: 'stack', value: new Error('test').stack },
  { propName: 'cause', value: new Error('test') },
  { propName: 'errors', value: [] },
];

const descriptorCases = [
  { writable: true, enumerable: false, configurable: true },
  { writable: false, enumerable: false, configurable: true },
  { writable: true, enumerable: true, configurable: true },
  { writable: true, enumerable: false, configurable: false },
  { writable: false, enumerable: true, configurable: false },
];

const combinedCases = propCases.flatMap((propCase) =>
  descriptorCases.map((descriptor) => ({ ...propCase, descriptor })),
);

test.each(combinedCases)(`Fix invalid descriptors | $propName | %#`, ({ propName, value, descriptor }) => {
  const error = new Error('test');
  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(error, propName, { ...descriptor, value });
  const errorA = normalizeException(error);
  const descriptorA = Object.getOwnPropertyDescriptor(errorA, propName);
  expect(descriptorA).toEqual({
    value: descriptorA.value,
    writable: true,
    enumerable: false,
    configurable: true,
  });
});
