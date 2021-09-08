// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright 2021 the denosaurs team. All rights reserved. MIT license.
// deno-lint-ignore-file

import init, {
  source,
  urlpattern_parse as urlpatternParse,
  urlpattern_process_match_input as urlpatternProcessMatchInput,
} from "./wasm/wasm.js";

import * as webidl from "./webidl.js";

await init(source);

export interface URLPatternInit {
  protocol?: string;
  username?: string;
  password?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  baseURL?: string;
}

export type URLPatternInput = string | URLPatternInit;

export interface URLPatternComponentResult {
  input: string;
  groups: Record<string, string>;
}

/** `URLPatternResult` is the object returned from `URLPattern.match`. */
export interface URLPatternResult {
  /** The inputs provided when matching. */
  inputs: [URLPatternInit] | [URLPatternInit, string];

  /** The matched result for the `protocol` matcher. */
  protocol: URLPatternComponentResult;
  /** The matched result for the `username` matcher. */
  username: URLPatternComponentResult;
  /** The matched result for the `password` matcher. */
  password: URLPatternComponentResult;
  /** The matched result for the `hostname` matcher. */
  hostname: URLPatternComponentResult;
  /** The matched result for the `port` matcher. */
  port: URLPatternComponentResult;
  /** The matched result for the `pathname` matcher. */
  pathname: URLPatternComponentResult;
  /** The matched result for the `search` matcher. */
  search: URLPatternComponentResult;
  /** The matched result for the `hash` matcher. */
  hash: URLPatternComponentResult;
}

const _components = Symbol("components");

/**
 * The URLPattern API provides a web platform primitive for matching URLs based
 * on a convenient pattern syntax.
 *
 * The syntax is based on path-to-regexp. Wildcards, named capture groups,
 * regular groups, and group modifiers are all supported.
 *
 * ```ts
 * // Specify the pattern as structured data.
 * const pattern = new URLPattern({ pathname: "/users/:user" });
 * const match = pattern.match("/users/joe");
 * console.log(match.pathname.groups.user); // joe
 * ```
 *
 * ```ts
 * // Specify a fully qualified string pattern.
 * const pattern = new URLPattern("https://example.com/books/:id");
 * console.log(pattern.test("https://example.com/books/123")); // true
 * console.log(pattern.test("https://deno.land/books/123")); // false
 * ```
 *
 * ```ts
 * // Specify a relative string pattern with a base URL.
 * const pattern = new URLPattern("/:article", "https://blog.example.com");
 * console.log(pattern.test("https://blog.example.com/article")); // true
 * console.log(pattern.test("https://blog.example.com/article/123")); // false
 * ```
 */
export class URLPattern {
  [webidl.brand]: symbol;
  [_components]: any;

  constructor(input: URLPatternInput, baseURL: string | undefined = undefined) {
    this[webidl.brand] = webidl.brand;
    const prefix = "Failed to construct 'URLPattern'";
    webidl.requiredArguments(arguments.length, 1, { prefix });
    input = webidl.converters.URLPatternInput(input, {
      prefix,
      context: "Argument 1",
    });
    if (baseURL !== undefined) {
      baseURL = webidl.converters.USVString(baseURL, {
        prefix,
        context: "Argument 2",
      });
    }

    const components = urlpatternParse(input, baseURL);

    for (const key of Object.keys(components)) {
      try {
        components[key].regexp = new RegExp(
          components[key].regexpString,
          "u",
        );
      } catch (e) {
        throw new TypeError(`${prefix}: ${key} is invalid; ${e.message}`);
      }
    }

    this[_components] = components;
  }

  /** The pattern string for the `protocol`. */
  get protocol() {
    webidl.assertBranded(this, URLPattern);
    return this[_components].protocol.patternString;
  }

  /** The pattern string for the `username`. */
  get username() {
    webidl.assertBranded(this, URLPattern);
    return this[_components].username.patternString;
  }

  /** The pattern string for the `password`. */
  get password() {
    webidl.assertBranded(this, URLPattern);
    return this[_components].password.patternString;
  }

  /** The pattern string for the `hostname`. */
  get hostname() {
    webidl.assertBranded(this, URLPattern);
    return this[_components].hostname.patternString;
  }

  /** The pattern string for the `port`. */
  get port() {
    webidl.assertBranded(this, URLPattern);
    return this[_components].port.patternString;
  }

  /** The pattern string for the `pathname`. */
  get pathname() {
    webidl.assertBranded(this, URLPattern);
    return this[_components].pathname.patternString;
  }

  /** The pattern string for the `search`. */
  get search() {
    webidl.assertBranded(this, URLPattern);
    return this[_components].search.patternString;
  }

  /** The pattern string for the `hash`. */
  get hash() {
    webidl.assertBranded(this, URLPattern);
    return this[_components].hash.patternString;
  }

  /**
   * Test if the given input matches the stored pattern.
   *
   * The input can either be provided as a url string (with an optional base),
   * or as individual components in the form of an object.
   *
   * ```ts
   * const pattern = new URLPattern("https://example.com/books/:id");
   *
   * // Test a url string.
   * console.log(pattern.test("https://example.com/books/123")); // true
   *
   * // Test a relative url with a base.
   * console.log(pattern.test("/books/123", "https://example.com")); // true
   *
   * // Test an object of url components.
   * console.log(pattern.test({ pathname: "/books/123" })); // true
   * ```
   */
  test(
    input: URLPatternInput,
    baseURL: string | undefined = undefined,
  ): boolean {
    webidl.assertBranded(this, URLPattern);
    const prefix = "Failed to execute 'test' on 'URLPattern'";
    webidl.requiredArguments(arguments.length, 1, { prefix });
    input = webidl.converters.URLPatternInput(input, {
      prefix,
      context: "Argument 1",
    });
    if (baseURL !== undefined) {
      baseURL = webidl.converters.USVString(baseURL, {
        prefix,
        context: "Argument 2",
      });
    }

    const res = urlpatternProcessMatchInput(
      input,
      baseURL,
    );
    if (res === null) {
      return false;
    }

    const [values] = res;

    for (const key of Object.keys(values)) {
      if (!this[_components][key].regexp.test(values[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Match the given input against the stored pattern.
   *
   * The input can either be provided as a url string (with an optional base),
   * or as individual components in the form of an object.
   *
   * ```ts
   * const pattern = new URLPattern("https://example.com/books/:id");
   *
   * // Match a url string.
   * let match = pattern.match("https://example.com/books/123");
   * console.log(match.pathname.groups.id); // 123
   *
   * // Match a relative url with a base.
   * match = pattern.match("/books/123", "https://example.com");
   * console.log(match.pathname.groups.id); // 123
   *
   * // Match an object of url components.
   * match = pattern.match({ pathname: "/books/123" });
   * console.log(match.pathname.groups.id); // 123
   * ```
   */
  exec(
    input: URLPatternInput,
    baseURL: string | undefined = undefined,
  ): URLPatternResult | null {
    webidl.assertBranded(this, URLPattern);
    const prefix = "Failed to execute 'exec' on 'URLPattern'";
    webidl.requiredArguments(arguments.length, 1, { prefix });
    input = webidl.converters.URLPatternInput(input, {
      prefix,
      context: "Argument 1",
    });
    if (baseURL !== undefined) {
      baseURL = webidl.converters.USVString(baseURL, {
        prefix,
        context: "Argument 2",
      });
    }

    const res = urlpatternProcessMatchInput(
      input,
      baseURL,
    );
    if (res === null) {
      return null;
    }

    const [values, inputs] = res;
    if (inputs[1] === null) {
      inputs.pop();
    }

    const result: any = { inputs };

    for (const key of Object.keys(values)) {
      const component = this[_components][key];
      const input = values[key];
      const match = component.regexp.exec(input);
      if (match === null) {
        return null;
      }
      const groupEntries = component.groupNameList.map(
        (name: string, i: number) => [name, match[i + 1] ?? ""],
      );
      const groups = Object.fromEntries(groupEntries);
      result[key] = {
        input,
        groups,
      };
    }

    return result;
  }

  [Symbol.for("Deno.customInspect")](inspect: (a: unknown) => string) {
    return `URLPattern ${
      inspect({
        protocol: this.protocol,
        username: this.username,
        password: this.password,
        hostname: this.hostname,
        port: this.port,
        pathname: this.pathname,
        search: this.search,
        hash: this.hash,
      })
    }`;
  }
}
