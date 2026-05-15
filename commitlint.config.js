/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'scope-enum': [
			2,
			'always',
			['common-ts', 'posthog-types', 'react', 'icons', 'deps', 'deps-dev', 'repo'],
		],
		'subject-case': [0],
	},
	ignores: [
		(message) => /^chore: release /.test(message),
		(message) => /\[skip ci\]/.test(message),
		(message) => /^Merge /.test(message),
	],
};
