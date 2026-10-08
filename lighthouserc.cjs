const baseUrl = process.env.LHCI_BASE_URL ?? "http://127.0.0.1:3000"

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      },
      url: [
        `${baseUrl}/`,
        `${baseUrl}/contact`,
        `${baseUrl}/work/document-intelligence-workflow`,
        `${baseUrl}/es`,
        `${baseUrl}/es/contact`,
      ],
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
        "resource-summary:script:size": ["warn", { maxNumericValue: 133120 }],
        "resource-summary:stylesheet:size": [
          "warn",
          { maxNumericValue: 35840 },
        ],
        "uses-text-compression": "error",
      },
    },
    upload: {
      outputDir: ".lighthouseci",
      target: "filesystem",
    },
  },
}
