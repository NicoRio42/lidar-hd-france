module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "standard-with-typescript",
        "prettier"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/prefer-ts-expect-error": "off",
        "n/no-callback-literal": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-unreachable-loop": "off",
        "@typescript-eslint/consistent-type-definitions": "off"
    }
}
