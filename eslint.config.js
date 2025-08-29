import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-plugin-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",

        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        alert: "readonly",
        confirm: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        URL: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        FormData: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        crypto: "readonly",
        Image: "readonly",
        Audio: "readonly",
        Notification: "readonly",

        // HTML element types (for React refs)
        HTMLElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLFormElement: "readonly",
        HTMLSelectElement: "readonly",
        HTMLOptionElement: "readonly",
        HTMLTableElement: "readonly",
        HTMLTableRowElement: "readonly",
        HTMLTableCellElement: "readonly",
        HTMLTableSectionElement: "readonly",
        HTMLTableCaptionElement: "readonly",
        HTMLAnchorElement: "readonly",
        HTMLSpanElement: "readonly",
        HTMLParagraphElement: "readonly",
        HTMLHeadingElement: "readonly",
        HTMLCanvasElement: "readonly",
        HTMLIFrameElement: "readonly",
        HTMLImageElement: "readonly",
        HTMLAudioElement: "readonly",
        HTMLVideoElement: "readonly",
        HTMLUListElement: "readonly",
        HTMLOListElement: "readonly",
        HTMLLIElement: "readonly",
        SVGElement: "readonly",
        SVGSVGElement: "readonly",

        // Event types
        Event: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        PointerEvent: "readonly",

        // Other Web APIs
        CanvasRenderingContext2D: "readonly",
        Node: "readonly",
        URLSearchParams: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",

        // React globals
        React: "readonly",

        // Vitest globals
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: react,
      "react-hooks": reactHooks,
      prettier: prettier,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-console": "warn",
      "no-debugger": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: ["dist", "node_modules", "coverage", ".next", "build"],
  },
];
