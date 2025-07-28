import { defineConfig } from 'tsup';
import fs from 'fs';
import path from 'path';

/**
 * Calculate and display total bundle size for a directory
 */
function logBundleSize(dir: string, label: string) {
	if (!fs.existsSync(dir)) {
		console.log(`📦 ${label}: Directory not found`);
		return;
	}

	let totalSize = 0;
	let fileCount = 0;

	function calculateDirSize(dirPath: string) {
		const items = fs.readdirSync(dirPath);

		for (const item of items) {
			const itemPath = path.join(dirPath, item);
			const stats = fs.statSync(itemPath);

			if (stats.isDirectory()) {
				calculateDirSize(itemPath);
			} else if (item.endsWith('.js') && !item.endsWith('.map')) {
				// Only count JS files, not source maps
				totalSize += stats.size;
				fileCount++;
			}
		}
	}

	calculateDirSize(dir);

	const sizeInKB = (totalSize / 1024).toFixed(2);
	const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

	console.log(
		`📦 ${label}: ${fileCount} files, ${sizeInKB} KB (${sizeInMB} MB)`
	);
}

/**
 * Get total bundle size in bytes for a directory (helper function)
 */
function getBundleSize(dir: string): number {
	if (!fs.existsSync(dir)) return 0;

	let totalSize = 0;

	function calculateDirSize(dirPath: string) {
		const items = fs.readdirSync(dirPath);

		for (const item of items) {
			const itemPath = path.join(dirPath, item);
			const stats = fs.statSync(itemPath);

			if (stats.isDirectory()) {
				calculateDirSize(itemPath);
			} else if (item.endsWith('.js') && !item.endsWith('.map')) {
				totalSize += stats.size;
			}
		}
	}

	calculateDirSize(dir);
	return totalSize;
}

/**
 * Dual package build configuration for @drift/common
 *
 * This configuration builds both ESM and CommonJS versions of the package
 * while preserving the original file structure for better tree-shaking
 * and selective imports.
 *
 * Output structure:
 * - lib/esm/ - ES modules for modern bundlers and browsers
 * - lib/cjs/ - CommonJS modules for Node.js compatibility
 */
export default defineConfig([
	// ESM Build Configuration
	// Optimized for modern bundlers (Webpack, Vite) and browsers
	{
		// Entry points: All TypeScript files and JSON files in src/
		entry: ['src/**/*.ts', 'src/**/*.json'],

		// Output format: ES modules (import/export syntax)
		format: ['esm'],

		dts: true,

		// Code splitting: Disabled to preserve file structure
		// Each input file becomes a separate output file
		splitting: false,

		// Source maps: Enabled for debugging
		sourcemap: true,

		// Clean output directory before build
		clean: true,

		// Suppress individual file size logging
		silent: true,

		// Output directory for ESM build
		outDir: 'lib/esm',

		// Output file extensions
		outExtension: () => ({ js: '.js' }),

		// Bundle mode: Disabled to preserve individual file structure
		// This allows consumers to import specific files for better tree-shaking
		bundle: false,

		// Platform configuration: Target browser environment
		platform: 'browser',

		// File loaders: How to handle different file types
		loader: {
			'.json': 'copy', // Copy JSON files as-is to output directory
		},

		// Post-build callback: Log bundle size
		onSuccess: async () => {
			logBundleSize('lib/esm', 'ESM Bundle Size');
		},
	},

	// CommonJS Build Configuration
	// For Node.js compatibility and legacy environments
	{
		// Entry points: Same as ESM build
		entry: ['src/**/*.ts', 'src/**/*.json'],

		// Output format: CommonJS (require/module.exports syntax)
		format: ['cjs'],

		// TypeScript declarations: Only generate once (in ESM build)
		dts: false,

		// Code splitting: Disabled to preserve file structure
		splitting: false,

		// Source maps: Enabled for debugging
		sourcemap: true,

		// Suppress individual file size logging
		silent: true,

		// Output directory for CommonJS build
		outDir: 'lib/cjs',

		// Output file extensions: .js for CommonJS
		outExtension: () => ({ js: '.js' }),

		// Bundle mode: Disabled to preserve individual file structure
		bundle: false,

		// Platform configuration: Target browser environment (for compatibility)
		platform: 'browser',

		// File loaders: Same as ESM build
		loader: {
			'.json': 'copy', // Copy JSON files as-is to output directory
		},

		// Post-build callback: Log bundle size and total summary
		onSuccess: async () => {
			logBundleSize('lib/cjs', 'CommonJS Bundle Size');

			// Calculate and log total size across both formats
			console.log('');
			console.log('📊 Build Summary:');
			logBundleSize('lib/esm', '  ESM Total');
			logBundleSize('lib/cjs', '  CommonJS Total');

			// Calculate combined size
			const esmSize = getBundleSize('lib/esm');
			const cjsSize = getBundleSize('lib/cjs');
			const totalSizeKB = ((esmSize + cjsSize) / 1024).toFixed(2);
			const totalSizeMB = ((esmSize + cjsSize) / (1024 * 1024)).toFixed(2);

			console.log(`  📦 Combined Total: ${totalSizeKB} KB (${totalSizeMB} MB)`);
			console.log('');
		},
	},
]);
