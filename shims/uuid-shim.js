// Shim for uuid to provide a default export that matches the expected structure for react-native-gifted-chat

import * as uuid from 'uuid';

// Create a default export that includes all named exports
const uuidDefault = {
  v1: uuid.v1,
  v3: uuid.v3,
  v4: uuid.v4,
  v5: uuid.v5,
  v6: uuid.v6,
  v7: uuid.v7,
  v1ToV6: uuid.v1ToV6,
  v6ToV1: uuid.v6ToV1,
  NIL: uuid.NIL,
  MAX: uuid.MAX,
  parse: uuid.parse,
  stringify: uuid.stringify,
  validate: uuid.validate,
  version: uuid.version,
};

export default uuidDefault;

export * from 'uuid';
