import * as __import0 from "config";
async function instantiate(module, imports = {}) {
  const __module0 = imports.config;
  const adaptedImports = {
    config: __module0,
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      seed() {
        // ~lib/builtins/seed() => f64
        return (() => {
          // @external.js
          return Date.now() * Math.random();
        })();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  return exports;
}
export const {
  init,
  drawAtPos,
  fillRandomly,
  step,
  recalculateMemory
} = await (async url => instantiate(
  await (
    typeof globalThis.fetch === "function"
      ? WebAssembly.compileStreaming(globalThis.fetch(url))
      : WebAssembly.compile(await (await import("node:fs/promises")).readFile(url))
  ), {
    config: __maybeDefault(__import0),
  }
))(new URL("debug.wasm", import.meta.url));
function __maybeDefault(module) {
  return typeof module.default === "object" && Object.keys(module).length == 1
    ? module.default
    : module;
}
