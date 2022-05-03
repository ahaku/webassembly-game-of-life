import { IExports } from "./types";
import {
  canvas,
  clearButton,
  context,
  runButton,
  saveButton,
  savesSelect,
  stepButton,
  updateSelectOptions,
} from "./ui";
import loader from "@assemblyscript/loader";
import { db } from "./db";

let isRunning = false;
const RGB_ALIVE = 0xfd9925;
const RGB_DEAD = 0x212121;
const BIT_ROT = 10;
const bcr = canvas.getBoundingClientRect();
runButton.innerHTML = "Start";
runButton.addEventListener("click", () => {
  isRunning = !isRunning;
  runButton.innerHTML = isRunning ? "Stop" : "Start";
  stepButton.disabled = isRunning;
});

const SIZE_BIT_OFFSET = 4; // shifts all the bits

// 2px per cell
const width = bcr.width >>> SIZE_BIT_OFFSET;
const height = bcr.height >>> SIZE_BIT_OFFSET;
const size = width * height;
const byteSize = (size * 2) << 2; // 4b per cell
canvas.width = width;
canvas.height = height;
context.imageSmoothingEnabled = false;

const memory = new WebAssembly.Memory({
  initial: ((byteSize + 0xffff) & ~0xffff) >>> 16,
});
const importObject = {
  env: {
    memory,
    abort: (msg, _file, line, column) =>
      console.error(`Error at ${line}:${column}`, msg),
    _log: console.log,
    seed: Math.random,
  },
  imports: {
    log: console.log,
  },
  config: {
    BGR_ALIVE: rgb2bgr(RGB_ALIVE) | 1, // little endian, LSB must be set
    BGR_DEAD: rgb2bgr(RGB_DEAD) & ~1, // little endian, LSB must not be set
    BIT_ROT,
  },
  // Math,
};
loader.instantiate(fetch("build/debug.wasm"), importObject).then((module) => {
  const exports = module.exports as IExports;
  let pressed = false;

  exports.init(width, height);

  const memoryBuffer = new Uint32Array(memory.buffer);

  stepButton.onclick = () => {
    memoryBuffer.copyWithin(0, size, size + size);
    exports.step();
  };

  clearButton.onclick = () => {
    memoryBuffer.fill(0);
  };

  updateSelectOptions();

  savesSelect.onchange = (e) => {
    const id = Number((<HTMLSelectElement>e.target).value);
    db.transaction("r", db.saves, async () => {
      const { data } = await db.saves.get(id);
      memoryBuffer.fill(0);
      memoryBuffer.set(data);
    });
  };

  saveButton.onclick = () => {
    const copy = new Uint32Array(memory.buffer.slice(0));
    const date = new Date();
    const stamp = `${date.toDateString()} | ${date.toLocaleTimeString()}`;
    db.saves.put({ data: copy, stamp }).then(() => {
      updateSelectOptions();
    });
  };

  (function update() {
    setTimeout(update, 1000 / 30);
    if (isRunning) {
      memoryBuffer.copyWithin(0, size, size + size); // copy output to input
      exports.step(); // perform the next step
    }
  })();

  // Keep rendering the output at [size, 2*size]
  const imageData = context.createImageData(width, height);
  const argb = new Uint32Array(imageData.data.buffer);
  (function render() {
    requestAnimationFrame(render);
    argb.set(memoryBuffer.subarray(size, size + size)); // copy output to image buffer
    context.putImageData(imageData, 0, 0); // apply image buffer
  })();

  // canvas.addEventListener("mousedown", ({ x, y }) => {
  //   memoryBuffer.copyWithin(0, size, size + size);
  //   exports.drawAtPos(x >>> SIZE_BIT_OFFSET, y >>> SIZE_BIT_OFFSET);
  // });

  [
    [canvas, "mousedown"],
    [canvas, "touchstart"],
  ].forEach((eh: [HTMLCanvasElement, string]) =>
    eh[0].addEventListener(eh[1], () => (pressed = true))
  );
  [
    [document, "mouseup"],
    [document, "touchend"],
  ].forEach((eh: [Document, string]) =>
    eh[0].addEventListener(eh[1], () => (pressed = false))
  );
  [
    [canvas, "mousemove"],
    [canvas, "touchmove"],
    [canvas, "mousedown"],
  ].forEach((eh: [HTMLCanvasElement, string]) =>
    eh[0].addEventListener(eh[1], (e: Event | TouchEvent) => {
      if (!pressed) return;
      let event;
      if ("touches" in e) {
        if (e.touches.length > 1) return;
        event = e.touches[0];
      } else {
        event = e;
      }
      memoryBuffer.copyWithin(0, size, size + size);
      exports.drawAtPos(
        event.x >>> SIZE_BIT_OFFSET,
        event.y >>> SIZE_BIT_OFFSET
      );
    })
  );
});

function rgb2bgr(rgb) {
  return ((rgb >>> 16) & 0xff) | (rgb & 0xff00) | ((rgb & 0xff) << 16);
}
