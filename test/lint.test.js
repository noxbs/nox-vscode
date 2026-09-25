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

const topLevelSettings = `set swift_settings_object := \`swiftc -parse-as-library -c SettingsView.swift\`

project "example" {
  executable "example" {
    sources = ["main.cpp"]
  }
}`;

assert.deepEqual(lintBuild(topLevelSettings), []);

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

  library.static "static-lib" {
    sources = ["static.c"]
  }

  library.shared "shared-lib" {
    sources = ["shared.c"]
  }

  library.rust "rust-lib" {
    sources = ["src/lib.rs"]
  }

  library.qsharp "qsharp-lib" {
    sources = ["src/lib.qs"]
  }
}`;

assert.deepEqual(lintBuild(currentSyntax), []);

const deprecatedLibrarySyntax = `project "legacy" {
  static_library "static" {
    sources = ["static.c"]
  }
  qsharp_library "qsharp" {
    sources = ["lib.qs"]
  }
}`;

assert.equal(lintBuild(deprecatedLibrarySyntax).length, 2);
assert.equal(lintBuild(deprecatedLibrarySyntax)[0].severity, 1);
assert.match(lintBuild(deprecatedLibrarySyntax)[0].message, /v1\.3\.0/);

const dotnetSyntax = `project "dotnet-demo" {
  executable.qsharp "app" {
    sources = ["src/main.qs"]
  }

  executable.csharp "lib" {
    sources = ["src/Program.cs"]
  }
}`;

assert.deepEqual(lintBuild(dotnetSyntax), []);

const gradleSyntax = `project "oatmeal" {
  executable.kotlin "app" {
    sources = ["app/src/main/kotlin/Main.kt"]
  }

  executable.gradle "build" {
    gradle_tasks = [":app:build"]
    gradle_options = ["--offline", "--stacktrace"]
    gradle_run_tasks = [":app:run"]
    gradle_run_options = ["--console=plain"]
  }

  executable.gradle "test" {
    tasks = [":app:test"]
    options = ["--console=plain"]
  }
}`;

assert.deepEqual(lintBuild(gradleSyntax), []);

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

const projectEnv = `project "demo" {
  extra.env {
    RUST_BACKTRACE = "full"
    CARGO_TERM_COLOR = "always"
  }

  executable.rust "demo" {
    sources = ["src/main.rs"]
  }
}`;

assert.deepEqual(lintBuild(projectEnv), []);

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
