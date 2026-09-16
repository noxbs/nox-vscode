const assert = require("node:assert/strict");
const { lintBuild } = require("../src/lint/build");
const { lintNoml, lintNoxfile } = require("../src/lint");

const noml = `ruleset "commands" {
  command: build {
    aliases: ["b"]
    rules: {
      requires_project: true
      accepts_files_as_input: false
    }
  }
}`;

assert.deepEqual(lintNoml(noml), []);
assert.deepEqual(lintNoml(`ruleset "commands" { command: build {`)[0].message, "Expected `}` before the end of the file.");

const noxfile = `tasks:
  build:
    run: npm test
  format:
    run: |
      npx prettier --write "**/*.{js,json,md}"
  package:
    run: >
      npm run package`;

assert.deepEqual(lintNoxfile(noxfile), []);

const emptyRun = `tasks:
  build:
    run:`;

assert.equal(lintNoxfile(emptyRun)[0].message, "Task run command cannot be empty.");

const malformedTask = `tasks:
  build`;

assert.equal(
  lintNoxfile(malformedTask)[0].message,
  "Expected a task name ending with `:`.",
);

const source = `project "ripnet" {
  version = file("./VERSION")
  version_files = ["VERSION", "package.json"]
  license = file("./LICENSE")
  executable.d "ripnet" {
    sources = ["src/main.d"]
    install = true
  }
}`;

assert.deepEqual(lintBuild(source), []);

const currentSyntax = `project "example" {
  let source_files = ["main.c"]
  let include_paths = ["include"]
  let warning_flags = ["-Wall", "-Wextra"]
  let should_install = true

  executable "app" {
    sources = source_files
    include_dirs = include_paths
    flags = warning_flags
    install = should_install
  }

  executable.cpp "cpp-app" {
    sources = ["main.cpp"]
  }
}`;

assert.deepEqual(lintBuild(currentSyntax), []);

const projectMetadata = `project "nox" {
  version = "1.2.3"
  repository = "https://example.com/repo"
  website = "https://example.com"
  authors = ["alice", "bob"]
  maintainers = ["carol <carol@example.com>"]

  executable.rust "nox" {
    sources = ["src/main.rs"]
  }
}`;

assert.deepEqual(lintBuild(projectMetadata), []);

const unsupportedExecutableLanguage = `project "example" {
  executable.ruby "app" {
    sources = ["main.rb"]
  }
}`;

assert.equal(
  lintBuild(unsupportedExecutableLanguage)[0].message,
  "Unsupported executable language `ruby`.",
);

const duplicateBinding = `project "example" {
  let flags = ["-Wall"]
  let flags = ["-Wextra"]
  executable "app" {
    sources = ["main.c"]
  }
}`;

assert.equal(lintBuild(duplicateBinding)[0].message, "Duplicate binding `flags`.");
