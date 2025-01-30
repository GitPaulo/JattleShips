import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import shebang from 'rollup-plugin-preserve-shebang';
import fs from 'fs';

const ensureDistFolder = () => {
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
};

const copyFile = (source, destination) => {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
  }
};

const packageJsonTransform = () => ({
  name: 'copy-files-and-package-json',
  buildEnd: () => {
    ensureDistFolder(); // Ensure `dist/` folder exists

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    // Ensure dependencies exist
    const dependencies = packageJson.dependencies || {};

    // Move node-gyp & node-pre-gyp from devDependencies to dependencies
    const devDepsToInclude = ['node-gyp', 'node-pre-gyp'];
    const devDependencies = packageJson.devDependencies || {};

    devDepsToInclude.forEach((dep) => {
      if (devDependencies[dep]) {
        dependencies[dep] = devDependencies[dep]; // Move to dependencies
      }
    });

    const distPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      main: 'app.js',
      type: packageJson.type,
      bin: { jattleships: './app.js' },
      dependencies,
      engines: packageJson.engines,
      author: packageJson.author,
      license: packageJson.license,
    };

    fs.writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));

    // Copy README.md and LICENSE
    copyFile('README.md', 'dist/README.md');
    copyFile('LICENSE', 'dist/LICENSE');
  },
});

export default {
  input: 'src/app.ts',
  output: {
    file: 'dist/app.js',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    shebang(),
    typescript(),
    nodeResolve({
      preferBuiltins: true,
      dedupe: ['yargs'],
    }),
    commonjs({
      ignoreTryCatch: false,
    }),
    terser(),
    packageJsonTransform(),
  ],
  external: ['wrtc', 'simple-peer'], // Avoid bundling large native modules
};
