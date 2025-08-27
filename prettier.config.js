//  @ts-check

/** @type {import('prettier').Config} */
const config = {
    trailingComma: "all",
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    printWidth: 140,
    plugins: ["prettier-plugin-tailwindcss"],
    tailwindFunctions: ["cva", "cn"],
    endOfLine: "auto",
};

export default config;
