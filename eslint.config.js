const globals = require('globals')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'no-undef': 'error',
            'no-console': 'off',
            eqeqeq: ['warn', 'always'],
            'no-var': 'error',
            'prefer-const': 'warn',
        },
    },
    prettierConfig,
    {
        ignores: ['node_modules/**'],
    },
]
