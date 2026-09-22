# [Nox](https://github.com/playfairs/nox) v1.1.6 Language Support for Visual Studio Code

Syntax highlighting and live diagnostics for Nox project, task, and NOML files. This
extension supports Nox versions up to and including `v1.1.6`.

The extension version is defined in `VERSION`. Before packaging locally, synchronize the VS Code manifest:

```sh
npm run package
```

The extension lints open `nox.build`, `noxfile`, and `nox.state` documents as you edit them. Syntax errors, malformed arrays, missing braces, unknown project or target properties, duplicate targets/tasks/bindings, invalid `install` values, and malformed state entries appear in VS Code's Problems panel with source ranges. The `nox.build` linter recognizes project-level `let` bindings, binding references, qualified executable targets such as `executable.rust` and `executable.cpp`, and Gradle-backed targets such as `executable.kotlin` and `executable.gradle` with their build and run task/option properties.

Recognized files:

- `nox.build`
- `noxfile`
- `nox.state`
- `*.nox`
- `*.noml`

The extension highlights Nox project declarations, `let` bindings, targets, properties, strings, comments, booleans, numbers, and native expressions such as `file()`, `glob()`, and `license = file("./LICENSE")`.
NOML files receive syntax highlighting for rulesets, entries, properties, strings, comments, booleans, numbers, and punctuation, plus the existing Nox language icon until a dedicated NOML icon is available.

The runtime is organized under `src/`: activation lives in `src/extension.js`, document linting in `src/lint/index.js`, and build parsing in `src/lint/build.js`.

## Development

Open this folder in VS Code and press `F5` to launch an Extension Development Host. Open a `nox.build`, `noxfile`, or `.noml` file there to inspect the highlighting.

Use `Developer: Inspect Editor Tokens and Scopes` from the Command Palette to inspect grammar scopes.

Run `npm test` to verify build-file linting, including qualified D, Kotlin, and Gradle targets.

Run `nox task install` to package the extension, remove the existing
`playfairs.nox-language-support` installation, and install the new VSIX.
On macOS, it falls back to launching Visual Studio Code with `open` when the
`code` command is not on your `PATH`.
