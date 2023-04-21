const semantic_release_config = {
  "branches": [
    "main",
    {
      "name": "next",
      "prerelease": true,
    },
  ],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "angular",
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "preset": "angular",
      },
    ],
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md",
        "changelogTitle": "Changelog",
      },
    ],
    [
      "@semantic-release/git",
      {
        "assets": [
          "CHANGELOG.md",
          "RELEASE",
        ],
      },
    ],
    [
      "@semantic-release/npm",
    ]
  ],
};

module.exports = semantic_release_config;