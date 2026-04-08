import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "VOBDashboard-main/**",
      "GWDienstleistungROI-main/**",
      "GWRecruitingAdmin-main/**",
      "SeehaferAffiliateAdminSite-main-2/**",
      "SeehaferAffiliateReferrerSite-main/**",
      "SeehaferRecruitingReferral-main/**",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
);
