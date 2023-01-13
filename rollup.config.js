import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: ['src/module/helveczia.ts'],
    output: {
      dir: 'dist/module',
      format: 'es',
      sourcemap: true,
    },
    plugins: [nodeResolve(), typescript()],
  },
  // {
  //   input: ['src/lib/jspdf.es.min.js'],
  //   output: {
  //     dir: 'dist/lib',
  //     format: 'es',
  //     sourcemap: true,
  //   },
  //   plugins: [nodeResolve(), commonjs()],
  // },
];
