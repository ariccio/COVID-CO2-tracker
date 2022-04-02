// eslint-disable-next-line no-undef
module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "react-app",
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/jsx-runtime",
        "plugin:jsx-a11y/recommended",
        "plugin:react-hooks/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "@typescript-eslint",
        "react-perf",
        "jsx-a11y"
    ],
    "rules": {
        "no-debugger": "off",
        "react/prop-types": "off",
        "@typescript-eslint/no-explicit-any": "off",

        // Shh. I'm a C++ guy at heart!
        "@typescript-eslint/no-inferrable-types": "off"
    },
    "reportUnusedDisableDirectives": true
};
