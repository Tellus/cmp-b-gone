const semantic_release_config = {
  "repositoryUrl": "https://github.com/inqludeit/qualweb-plugin-cmp.git",
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
      "@semantic-release/exec",
      {
        "generateNotesCmd": "echo ${nextRelease.version} > RELEASE"
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
  ],
};

module.exports = semantic_release_config;