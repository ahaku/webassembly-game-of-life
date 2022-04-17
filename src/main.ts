import { IExports } from "./types";
import { canvas, context, runButton, stepButton } from "./ui";

let isRunning = false;
runButton.innerHTML = "Start";
runButton.addEventListener("click", () => {
  isRunning = !isRunning;
  runButton.innerHTML = isRunning ? "Stop" : "Start";
  stepButton.disabled = isRunning;
});

const SCALE_OFFSET = 2;
let width: number = 0,
  height: number = 0,
  size: number = 0,
  byteSize: number = 0;

const calculateSizes = () => {
  height = canvas.offsetHeight >>> SCALE_OFFSET;
  width = canvas.offsetWidth >>> SCALE_OFFSET;
  canvas.width = width;
  canvas.height = height;
  size = width * height;
  byteSize = (size + size) << 2;
};
context.imageSmoothingEnabled = false;

// Compute the size of and instantiate the module's memory
// Pages are 64kb. Rounds up using mask 0xffff before shifting to pages.
const memory = new WebAssembly.Memory({
  initial: ((byteSize + 0xffff) & ~0xffff) >>> 16, // or we can use just a number of pages, e.g 1 is equal to 64KiB
});
const importObject = {
  env: {
    memory,
    abort: function () {},
    _log: console.log,
    seed: Math.random,
  },
  imports: {
    log: console.log,
  },
  config: {
    EXAMPLE_COLOR: 0xff901e00, // little endian, LSB must be set
  },
};

WebAssembly.instantiateStreaming(fetch("build/debug.wasm"), importObject).then(
  (module) => {
    const exports = module.instance.exports as IExports;
    let imageData: ImageData;
    let viewData: Uint32Array;
    let memoryBuffer: Uint32Array;

    const onResize = () => {
      calculateSizes();
      exports.recalculateMemory(width, height);
      memoryBuffer = new Uint32Array(memory.buffer);
      imageData = context.createImageData(width, height);
      viewData = new Uint32Array(imageData.data.buffer);
    };
    onResize();

    new ResizeObserver(onResize).observe(canvas);
    stepButton.onclick = () => {
      exports.step();
    };

    exports.fillRandomly();

    canvas.addEventListener("mousedown", (e) => {
      exports.drawAtPos(e.clientX >>> SCALE_OFFSET, e.clientY >>> SCALE_OFFSET);
    });

    (function update() {
      setTimeout(update, 1000 / 30);
      if (isRunning) {
        exports.step();
      }
    })();

    // Render
    (function render() {
      requestAnimationFrame(render);
      viewData.set(memoryBuffer.subarray(0, width * height)); // copy output to image buffer
      context.putImageData(imageData, 0, 0); // apply image buffer
    })();
  }
);
