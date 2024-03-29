# Changesets

Hello and welcome! This folder has been automatically generated by `@changesets/cli`, a build tool that works
with multi-package repos, or single-package repos to help you version and publish your code. You can
find the full documentation for it [in our repository](https://github.com/changesets/changesets)

We have a quick list of common questions to get you started engaging with this project in
[our documentation](https://github.com/changesets/changesets/blob/main/docs/common-questions.md)

## Adding a changeset

Use `pnpm changeset` to add a changeset. Pick the patch type that matches the changes you made (we use semantic versioning), and write a summary. This will be logged in a changeset file that you must commit to git. A recommended git message is of the form "docs(changeset): <summary>".

The changeset file is just markdown (after the frontmatter) and will be used to generate a changelog when we release.

Some changes do not (or should not) require a version bump. In order to log a changeset for such a change, use `pnpm changeset --blank` instead.