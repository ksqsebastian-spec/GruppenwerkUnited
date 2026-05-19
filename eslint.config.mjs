import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".claude/**",
      "VOBDashboard-main/**",
      "GWDienstleistungROI-main/**",
      "GWRecruitingAdmin-main/**",
      "SeehaferAffiliateAdminSite-main-2/**",
      "SeehaferAffiliateReferrerSite-main/**",
      "SeehaferRecruitingReferral-main/**",
      "*.config.js",
      "*.config.mjs",
      "postcss.config.js",
      "tailwind.config.js",
      "next.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
);
