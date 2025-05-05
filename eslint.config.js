/* eslint-disable @typescript-eslint/no-require-imports */
const {
    fixupPluginRules,
} = require("@eslint/compat");
const {
    FlatCompat,
} = require("@eslint/eslintrc");
const js = require("@eslint/js");
const typescriptEslintEslintPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const _import = require("eslint-plugin-import");


const globals = require("globals");


const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        parser: tsParser,
        sourceType: "module",

        parserOptions: {
            project: "tsconfig.json",
            tsconfigRootDir: __dirname,
        },

        globals: {
            ...globals.node,
            ...globals.jest,
        },
    },

    plugins: {
        "@typescript-eslint": typescriptEslintEslintPlugin,
        import: fixupPluginRules(_import),
    },

    extends: compat.extends("plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"),

    rules: {
        "prettier/prettier": 0,
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",

        "import/order": ["error", {
            groups: ["builtin", "external", "internal", "parent", "sibling", "index"],

            alphabetize: {
                order: "asc",
                caseInsensitive: true,
            },
        }],
    },
}, globalIgnores(["**/.eslintrc.js"]), {
    files: ["**/*.spec.ts", "**/*.test.ts"],

    rules: {
        "import/order": "off",
    },
}]);
