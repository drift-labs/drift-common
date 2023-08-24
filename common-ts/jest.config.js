/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'node',
	moduleFileExtensions: ['ts', 'js'],
	testRegex: '.test.ts',
	transform: {},
};
