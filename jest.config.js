module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    "@root/(.*)": "<rootDir>/src/$1"
  },
};
