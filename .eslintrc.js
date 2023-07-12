module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: { jsx: true },
	},
	env: {
		browser: true,
		node: true,
	},
	ignorePatterns: [
		'**/lib',
		'**/node_modules',
		'protocol',
		'icons/**',
		'snap-solana',
	],
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		'@typescript-eslint/triple-slash-reference': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/ban-ts-ignore': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unexpected-multiline': 'off',
		'@typescript-eslint/no-unused-vars': [
			2,
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			},
		],
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/no-empty-function': 0,
		'no-mixed-spaces-and-tabs': [2, 'smart-tabs'],
		semi: 2,
		'no-restricted-imports': [
			'error',
			{
				patterns: [
					{
						// Restrict importing BN from bn.js
						group: ['bn.js'],
						message: 'Import BN from @drift-labs/sdk instead',
					},
				],
			},
		],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};
