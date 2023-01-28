import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: ['src/module/helveczia.ts'],
  output: {
    dir: 'dist/module',
    format: 'es',
    sourcemap: true,
  },
  external: ['canvg', 'html2canvas', 'dompurify'],
  preserveEntrySignatures: false,
  plugins: [
    nodeResolve(),
    typescript(),
    commonjs({
      include: 'node_modules/**',
    }),
  ],
};
