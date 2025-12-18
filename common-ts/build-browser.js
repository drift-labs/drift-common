const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

function getPackageExternalModules() {
	const packageJsonPath = path.resolve(__dirname, 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

	const dependencyNames = Object.keys(packageJson.dependencies ?? {});
	const peerDependencyNames = Object.keys(packageJson.peerDependencies ?? {});

	return Array.from(new Set([...dependencyNames, ...peerDependencyNames]));
}

async function build() {
	try {
		fs.mkdirSync(path.resolve(__dirname, 'dist'), { recursive: true });

		await esbuild.build({
			entryPoints: ['./lib/index.js'],
			bundle: true,
			minify: true,
			format: 'cjs',
			platform: 'browser',
			target: ['es2020'],
			outfile: './dist/browser.min.js',
			external: getPackageExternalModules(),
			define: {
				'process.env.NODE_ENV': '"production"',
				global: 'globalThis',
			},
			inject: [path.resolve(__dirname, 'esbuild-shims.js')],
			alias: {
				// Node polyfills for browser
				crypto: 'crypto-browserify',
				stream: 'stream-browserify',
				path: 'path-browserify',
				os: 'os-browserify/browser',
				process: 'process/browser',
				vm: 'vm-browserify',
			},
			// Ignore node-only modules
			plugins: [
				{
					name: 'ignore-node-modules',
					setup(build) {
						build.onResolve(
							{ filter: /^(fs|net|dns|tls|http2|child_process)$/ },
							(args) => {
								return { path: args.path, namespace: 'ignore-ns' };
							}
						);
						build.onLoad({ filter: /.*/, namespace: 'ignore-ns' }, () => {
							return { contents: 'export default {}' };
						});
					},
				},
			],
			loader: {
				'.json': 'json',
			},
			treeShaking: true,
			sourcemap: false,
		});

		console.log('✅ common-ts browser minify complete');
	} catch (error) {
		console.error('❌ Browser minify failed:', error);
		process.exit(1);
	}
}

build();
