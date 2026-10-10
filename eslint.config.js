import eslint from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['dist/**', 'coverage/**', '**/*.ts', '**/*.tsx'],
    },
    {
        ...eslint.configs.recommended,
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },
];
