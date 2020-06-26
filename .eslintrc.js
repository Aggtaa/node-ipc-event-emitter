module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2015,
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin', 'chai-friendly', 'import', 'mocha'],
    env: {
      browser: false,
      node: true,
    },
    "ignorePatterns": ["dist/**"],
    "overrides": [
        {
            "files": [
                '**/*.test.ts',
                '**/*.test.include.ts',
            ],
            "env": {
                "mocha": true
            },
            "rules": {
                "no-unused-expressions": "off",
                "chai-friendly/no-unused-expressions": "error",
                "@typescript-eslint/explicit-function-return-type": ["error", { "allowExpressions": true, "allowTypedFunctionExpressions": true }],
                "prefer-arrow-callback": "off",
                "mocha/no-hooks-for-single-case": "off",
//                "func-style": ["error", "declaration", {"allowArrowFunctions": false}],
                "func-names": "off",
                "mocha/no-pending-tests": "off",
                "@typescript-eslint/no-var-requires": "off",
                "global-require": "off",
                "mocha/no-setup-in-describe": "off",
                "mocha/no-exclusive-tests": "error"
            }
        }
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'airbnb',
      'plugin:mocha/recommended',
    ],
    settings: {
        "react": {
            // fix for annoying warning
            // Warning: React version was set to "detect" in eslint-plugin-react settings, but the "react" package is not installed. Assuming latest React version for linting.
            // https://github.com/DRD4-7R/eslint-config-7r-building/issues/1
            "version": "999.999.999"
        },
        "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"]
        },
        "import/resolver": {
            "typescript": {
                "directory": "./tsconfig.json"
            },
            "node": {
                "extensions": [".js", ".jsx", ".ts", ".tsx"]
            }
        }
    },
    rules: {
        "prettier/prettier": ["off", {
            "singleQuote": true,
        }, {
            "usePrettierrc": false,
            "fileInfoOptions": { "withNodeModules": true }
        }],
        'no-console': 'error',
        'import/extensions': ['error', 'ignorePackages', {
            ts: 'never',
            tsx: 'never',
            js: 'never', 
            jsx: 'never',
        }],
        "indent": ["error", 4],
        "dot-notation": "off",
        "no-case-declarations": "off",
        'semi': 'error',
        'no-lonely-if': 'off',
        "@typescript-eslint/no-inferrable-types": "off",
        '@typescript-eslint/interface-name-prefix': 'off',
        'max-classes-per-file': 'off',
        'import/prefer-default-export': 'off',
        "spaced-comment": ["error", "always", { "exceptions": ["TODO", "DEBUG", "IMPLEMENT", "FIXME"] }],
        'jest/no-hooks': 'off',
        'prefer-template': 'off',
        'lines-between-class-members': ['error', 'always', { "exceptAfterSingleLine": true }],
        'object-shorthand': 'off',
        'class-methods-use-this': 'off',
        'new-cap': ['error', { 'newIsCapExceptions': ['type'] }],
        'no-dupe-class-members': 'off',
        'no-plusplus': 'off',
        'no-loop-func': 'off',
        'prefer-destructuring': 'off',
        'no-unused-vars': 'off', // duplicated by @typescript-eslint/no-unused-vars
        // 'import/no-cycle': 'off',
        'no-await-in-loop': 'off',
        "padded-blocks": "off",
        "no-param-reassign": "off",
        "operator-linebreak": "off",
        "no-underscore-dangle": "off",
        "nonblock-statement-body-position": ['error', 'below'],
        'curly': ['error', 'multi'],
        'implicit-arrow-linebreak': 'off',
        'brace-style': ['error', 'stroustrup', { 'allowSingleLine': false }]
    }
};