const componentTemplate = require('./src/templates/componentTemplate');

module.exports = {
	typescript: true,
	icon: true,
	svgProps: {
		width: 'inherit',
		height: 'inherit',
	},
	replaceAttrValues: {
		'#6683A7': '{allProps.color ? allProps.color : "currentColor"}',
	},
	plugins: [
		// Clean SVG files using SVGO
		'@svgr/plugin-svgo',
		// Generate JSX
		'@svgr/plugin-jsx',
		// Format the result using Prettier
		'@svgr/plugin-prettier',
	],
	svgoConfig: {},
	template: componentTemplate,
};
