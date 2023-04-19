process.env.TS_NODE_PROJECT = "tsconfig.test.json"

module.exports = {
  "color": true,
  "ui": "bdd",
  "file": [
  ],
  "spec": "test/**/*.spec.ts",
  "require": [
    "tsconfig-paths/register",
    "ts-node/register",
  ],

}
