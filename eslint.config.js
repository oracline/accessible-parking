// eslint.config.js
import {
    defineConfig
} from 'eslint/config';

export default defineConfig([
    {
        rules: {
            'semi': 'error',
			      'prefer-const': 'error',
            'quotes': ['error', 'single'],      // Enforce the use of single quotes for strings
			      'eqeqeq': ['error', 'always'],      // Require using strict equality (===) over loose equality (==)
			      'no-console': 'warn',               // Warn when `console` is used (good for production)
			      'curly': ['error', 'all'],          // Require curly braces for all control structures
            'indent': ['error', 4],           // Enforce 4 spaces for indentation
            'linebreak-style': ['error', 'unix'],  // Ensure consistent linebreaks (Unix)
            'object-curly-spacing': ['error', 'always'], // Enforce spacing inside curly braces
            'array-bracket-spacing': ['error', 'never'],  // Enforce no spaces inside array brackets
            'newline-per-chained-call': ['error', { 'ignoreChainWithDepth': 2 }], // Enforce newlines in chained calls
            'padding-line-between-statements': [
                'error',
                {
                    blankLine: 'always', prev: 'const', next: 'return'
                },
                {
                    blankLine: 'always', prev: 'var', next: 'return'
                },
                {
                    blankLine: 'always', prev: 'function', next: 'block'
                },
                {
                    blankLine: 'always', prev: 'block', next: 'block'
                },
            ],
            'multiline-ternary': ['error', 'always-multiline'],
            'object-curly-newline': ['error', {
                'ObjectExpression': {
                    'multiline': true, 'minProperties': 2
                },
                'ObjectPattern': {
                    'multiline': true, 'minProperties': 2
                },
                'ImportDeclaration': 'always',
                'ExportDeclaration': 'always',
            }],
            'operator-linebreak': ['error', 'before', { 'overrides': { '=': 'none' } }],
            'max-len': ['error', {
                'code': 120, 'ignoreUrls': true, 'ignoreStrings': true
            }],
      	},
    },
]);
