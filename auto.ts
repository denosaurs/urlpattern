// deno-lint-ignore-file

if (!("URLPattern" in window)) {
  //@ts-ignore
  window.URLPattern = (await import("./mod.ts")).URLPattern;
}
