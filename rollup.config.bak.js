import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './dist/es/index.js',
  output: {
    file: './dist/cjs/index.js',
    format: 'cjs'
  },
  plugins: [resolve()]
};