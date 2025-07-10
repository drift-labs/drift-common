// generate.ts
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import dotenv from 'dotenv';
import figmaApiExporter from 'figma-api-exporter';
import svgrConfig from '../svgr.config';
import { createIndex, downloadSVGsData, toPascalCase } from './utils';
const svgr = require('@svgr/core').default;

const ICONS_DIRECTORY_PATH = path.resolve(__dirname, './icons/components');
const SVG_DIRECTORY_PATH = path.resolve(__dirname, './icons/svgs');
const INDEX_DIRECTORY_PATH = path.resolve(__dirname, './icons');

// Load environment variables
dotenv.config();

// 1. Retrieve Figma Access Token, File ID and Canvas from .env file
const FIGMA_API_TOKEN = process.env.FIGMA_API_TOKEN;
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const FIGMA_CANVAS = process.env.FIGMA_CANVAS;

if (
	!FIGMA_API_TOKEN ||
	!FIGMA_FILE_ID ||
	!FIGMA_CANVAS ||
	FIGMA_API_TOKEN === 'NOT SET'
) {
	console.error('Environment Variables not set.');
	process.exit(1);
}

// 2. Fetch icons metadata from Figma
console.log(chalk.magentaBright('-> Fetching icons metadata'));
const exporter = figmaApiExporter(FIGMA_API_TOKEN);
exporter
	.getSvgs({
		fileId: FIGMA_FILE_ID,
		canvas: FIGMA_CANVAS,
	})
	.then(async (svgsData) => {
		// 3. Download SVG files from Figma
		console.log(chalk.blueBright(`-> Fetched ${svgsData.svgs.length} SVGs`));
		console.log(chalk.blueBright('-> Downloading SVG code'));

		const filteredSvgs = svgsData.svgs.filter((svg) =>
			svg.name.includes('ic/')
		);
		console.log(chalk.blueBright(`-> Filtered ${filteredSvgs.length} SVGs`));

		let downloadedSVGsData = await downloadSVGsData(filteredSvgs);

		// Filter out any icons that aren't 16px to remove duplicates
		downloadedSVGsData = downloadedSVGsData.filter((svg) =>
			svg.name.includes('ic/')
		);

		// Replace annoying stuff in icon names
		for (const svg of downloadedSVGsData) {
			svg.name = svg.name
				.replace('ic/', '')
				.replace('Icon', '')
				.replace('16px', '')
				.replace('Size', '')
				.replace(/ /g, '');
		}

		// 4. Read manually added SVGs data
		console.log(chalk.blueBright('-> Reading manually added SVGs'));
		const manuallyAddedSvgs: { data: string; name: string }[] = [];
		if (fs.existsSync(SVG_DIRECTORY_PATH)) {
			const svgFiles = fs
				.readdirSync(SVG_DIRECTORY_PATH)
				// Filter out hidden files (e.g. .DS_STORE)
				.filter((item) => !/(^|\/)\.[^/.]/g.test(item));
			svgFiles.forEach((fileName) => {
				const svgData = fs.readFileSync(
					path.resolve(SVG_DIRECTORY_PATH, fileName),
					'utf-8'
				);
				manuallyAddedSvgs.push({
					data: svgData,
					name: toPascalCase(fileName.replace(/svg/i, '')),
				});
			});
		} else {
			console.log(chalk.blueBright('-> No manually added SVGs found'));
		}

		const allSVGs = [...downloadedSVGsData, ...manuallyAddedSvgs];

		// Check for existing components that don't match Figma SVGs
		console.log(chalk.cyanBright('-> Checking for manually added components'));
		console.log(
			chalk.cyanBright(
				"-> (These components have either been added by hand, or may be stale - as they don't match the Figma SVGs)"
			)
		);
		const existingComponents = fs.existsSync(ICONS_DIRECTORY_PATH)
			? fs
					.readdirSync(ICONS_DIRECTORY_PATH)
					.filter((file) => file.endsWith('.tsx'))
					.map((file) => file.replace('.tsx', ''))
			: [];

		const generatedComponentNames = allSVGs.map((svg) =>
			toPascalCase(svg.name)
		);
		const manuallyAddedComponents = existingComponents.filter(
			(component) => !generatedComponentNames.includes(component)
		);

		if (manuallyAddedComponents.length > 0) {
			console.log(chalk.yellowBright('-> Found manually added components:'));
			manuallyAddedComponents.forEach((component) => {
				console.log(chalk.yellow(`   - ${component}`));
			});
		} else {
			console.log(chalk.green('-> No manually added components found'));
		}

		// 5. Convert SVG to React Components
		console.log(chalk.cyanBright('-> Converting to React components'));
		allSVGs.forEach((svg) => {
			const svgCode = svg.data;
			const componentName = toPascalCase(svg.name);
			const componentFileName = `${componentName}.tsx`;

			// Converts SVG code into React code using SVGR library
			const componentCode = svgr.sync(svgCode, svgrConfig, { componentName });

			// 6. Write generated component to file system
			fs.ensureDirSync(ICONS_DIRECTORY_PATH);
			fs.outputFileSync(
				path.resolve(ICONS_DIRECTORY_PATH, componentFileName),
				componentCode
			);
		});

		// 7. Generate index.ts
		console.log(chalk.yellowBright('-> Generating index file'));
		createIndex({
			componentsDirectoryPath: ICONS_DIRECTORY_PATH,
			indexDirectoryPath: INDEX_DIRECTORY_PATH,
			indexFileName: 'index.ts',
		});

		console.log(chalk.greenBright('-> All done! ✅'));
	})
	.catch((err: unknown) => {
		console.error(err);
		process.exit(1);
	});
