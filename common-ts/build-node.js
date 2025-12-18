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
      platform: 'node',
      target: ['node22'],
      outfile: './dist/node.min.js',
      external: getPackageExternalModules(),
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      loader: {
        '.json': 'json',
      },
      treeShaking: true,
      sourcemap: false,
    });

    console.log('✅ common-ts node minify complete');
  } catch (error) {
    console.error('❌ Node minify failed:', error);
    process.exit(1);
  }
}

build();
