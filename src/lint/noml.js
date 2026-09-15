class NomlParser {
  constructor(text) {
    this.text = text;
    this.tokens = tokenize(text);
    this.index = 0;
  }

  parse() {
    this.value();
    this.skipComma();
    if (!this.at("eof")) this.error("Unexpected content after the NOML document.");
  }

  value() {
    const token = this.peek();
    if (token.value === "ruleset") return this.ruleset();
    if (token.value === "{") return this.object();
    if (token.value === "[") return this.array();
    if (["string", "number", "identifier"].includes(token.type)) {
      this.index += 1;
      return;
    }
    this.error("Expected a NOML value.");
  }

  ruleset() {
    this.expectWord("ruleset");
    this.entryName("ruleset name");
    this.objectEntries(true);
  }

  object() {
    this.objectEntries(false);
  }

  objectEntries(ruleset) {
    this.expect("{");
    const names = new Set();
    while (!this.at("}")) {
      if (this.at("eof")) this.error("Expected `}` before the end of the file.");
      const key = this.word("property or entry name");
      this.expect(":");
      if (ruleset) {
        this.entryName("entry name");
        if (this.atWord("extends")) {
          this.index += 1;
          this.entryName("extension name");
        }
        this.objectEntries(false);
      } else {
        if (names.has(key)) this.error(`Duplicate property \`${key}\`.`);
        names.add(key);
        this.value();
      }
      this.skipComma();
    }
    this.expect("}");
  }

  array() {
    this.expect("[");
    while (!this.at("]")) {
      if (this.at("eof")) this.error("Expected `]` before the end of the file.");
      this.value();
      this.skipComma();
    }
    this.expect("]");
  }

  entryName(description) {
    const token = this.peek();
    if (token.type !== "string" && token.type !== "identifier") {
      this.error(`Expected a ${description}.`);
    }
    this.index += 1;
  }

  word(description) {
    const token = this.peek();
    if (token.type !== "identifier") this.error(`Expected a ${description}.`);
    this.index += 1;
    return token.value;
  }

  expectWord(word) {
    if (!this.atWord(word)) this.error(`Expected \`${word}\`.`);
    this.index += 1;
  }

  expect(value) {
    if (!this.at(value)) this.error(`Expected \`${value}\`.`);
    this.index += 1;
  }

  skipComma() {
    while (this.at(",")) this.index += 1;
  }

  at(value) {
    return value === "eof"
      ? this.peek().type === "eof"
      : this.peek().value === value;
  }

  atWord(value) {
    const token = this.peek();
    return token.type === "identifier" && token.value === value;
  }

  peek() {
    return this.tokens[this.index];
  }

  error(message) {
    const token = this.peek();
    const error = new Error(message);
    error.start = token.start;
    error.end = Math.max(token.end, token.start + 1);
    throw error;
  }
}

function tokenize(text) {
  const tokens = [];
  let index = 0;
  while (index < text.length) {
    const character = text[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "#" || (character === "/" && text[index + 1] === "/")) {
      const end = text.indexOf("\n", index);
      index = end === -1 ? text.length : end + 1;
      continue;
    }
    if (character === "/" && text[index + 1] === "*") {
      const end = text.indexOf("*/", index + 2);
      if (end === -1) tokenError(text, index, "Unterminated block comment.");
      index = end + 2;
      continue;
    }
    if ("{}[],:".includes(character)) {
      tokens.push({ type: "symbol", value: character, start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (character === '"') {
      const start = index++;
      while (index < text.length) {
        if (text[index] === "\\") {
          index += 2;
          continue;
        }
        if (text[index] === '"') {
          index += 1;
          tokens.push({ type: "string", value: text.slice(start + 1, index - 1), start, end: index });
          break;
        }
        index += 1;
      }
      if (tokens[tokens.length - 1]?.start !== start) tokenError(text, start, "Unterminated string literal.");
      continue;
    }
    const start = index;
    while (index < text.length && !/\s/.test(text[index]) && !"{}[],:\"".includes(text[index])) index += 1;
    const value = text.slice(start, index);
    tokens.push({ type: /^-?(?:\d+|\d+\.\d+)$/.test(value) ? "number" : "identifier", value, start, end: index });
  }
  tokens.push({ type: "eof", value: "<eof>", start: text.length, end: text.length });
  return tokens;
}

function tokenError(text, start, message) {
  const error = new Error(message);
  error.start = start;
  error.end = Math.max(start + 1, text.length);
  throw error;
}

function lintNoml(text) {
  try {
    new NomlParser(text).parse();
    return [];
  } catch (error) {
    return [{
      start: error.start ?? 0,
      end: error.end ?? Math.max(1, text.length),
      message: error.message,
    }];
  }
}

module.exports = { lintNoml };
