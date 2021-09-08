import { encode } from "https://deno.land/std@0.106.0/encoding/base64.ts";
import { compress } from "https://deno.land/x/lz4@v0.1.2/mod.ts";
import { minify } from "https://jspm.dev/terser@5.7.2";

const name = "urlpattern";

await Deno.run({
  cmd: ["wasm-pack", "build", "--target", "web", "--release"],
}).status();

const wasm = await Deno.readFile(`./pkg/${name}_bg.wasm`);
const init = await Deno.readTextFile(`./pkg/${name}.js`);
const encoded = encode(compress(wasm));
const source =
  `import { decode } from "https://deno.land/std@0.106.0/encoding/base64.ts";
import { decompress } from "https://deno.land/x/lz4@v0.1.2/mod.ts";
export const source = decompress(decode("${encoded}"));
${init}`;
const output = await minify(source, {
  mangle: { module: true },
  output: { preamble: "// deno-fmt-ignore-file\n// deno-lint-ignore-file" },
});

await Deno.writeTextFile("wasm/wasm.js", output.code);
