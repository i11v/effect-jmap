export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Formatting, missing semicolons, etc.
        "refactor", // Code refactoring
        "perf", // Performance improvements
        "test", // Adding tests
        "build", // Build system or external dependencies
        "ci", // CI configuration
        "chore", // Maintenance tasks
        "revert", // Revert previous commit
      ],
    ],
    "subject-case": [2, "always", "sentence-case"],
  },
};
