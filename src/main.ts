import { IExports } from "./types";
import {
  canvas,
  clearButton,
  context,
  dropButton,
  runButton,
  saveButton,
  savesSelect,
  stepButton,
  updateSelectOptions,
  zoomCanvas,
  zoomContainer,
  zoomContext,
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
zoomContainer.style.width = "200px";
zoomContainer.style.height = "200px";
zoomCanvas.width = width;
zoomCanvas.height = height;
zoomContext.imageSmoothingEnabled = false;

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
  function clearCanvas() {
    memoryBuffer.fill(0);
    zoomContext.clearRect(0, 0, canvas.width, canvas.height);
  }

  clearButton.onclick = () => {
    clearCanvas();
  };

  updateSelectOptions();

  savesSelect.onchange = (e) => {
    const id = Number((<HTMLSelectElement>e.target).value);
    db.transaction("r", db.saves, async () => {
      const { data } = await db.saves.get(id);
      // todo check resolution
      clearCanvas();
      memoryBuffer.set(data);
    });
  };

  saveButton.onclick = () => {
    const copy = new Uint32Array(memory.buffer.slice(0));
    const date = new Date();
    // todo save resolution
    const stamp = `${date.toDateString()} | ${date.toLocaleTimeString()}`;
    db.saves.put({ data: copy, stamp }).then(() => {
      updateSelectOptions();
    });
  };

  dropButton.onclick = () => {
    db.saves.clear().then(() => {
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
  const canvasRatio = canvas.width / canvas.height;
  const SUB_WIDTH = 50;
  const ZOOM_CANVAS_OFFSET = 17_600;
  const pixelsOnCell = canvas.clientWidth / width;
  const positions = {
    prevX: null,
    prevY: null,
    mouseX: 0,
    mouseY: 0,
  };

  // Keep rendering the output at [size, 2*size]
  const imageData = context.createImageData(width, height);
  const argb = new Uint32Array(imageData.data.buffer);

  (function render() {
    requestAnimationFrame(render);
    argb.set(memoryBuffer.subarray(size, size + size)); // copy output to image buffer
    context.putImageData(imageData, 0, 0); // apply image buffer
    // canvasCopyContext.putImageData(imageData, 0, 0);

    zoomContext.drawImage(
      canvas,
      positions.mouseX - 2,
      positions.mouseY - 2,
      SUB_WIDTH,
      SUB_WIDTH * canvasRatio,
      0,
      0,
      canvas.width + (ZOOM_CANVAS_OFFSET >>> SIZE_BIT_OFFSET),
      canvas.width + (ZOOM_CANVAS_OFFSET >>> SIZE_BIT_OFFSET)
    );
  })();

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
    eh[0].addEventListener(eh[1], () => {
      pressed = false;
      positions.prevX = null;
      positions.prevY = null;
    })
  );
  [
    [canvas, "mousemove"],
    [canvas, "touchmove"],
    [canvas, "mousedown"],
  ].forEach((eh: [HTMLCanvasElement, string]) =>
    eh[0].addEventListener(eh[1], (e: Event | TouchEvent) => {
      let event;
      if ("touches" in e) {
        if (e.touches.length > 1) return;
        event = e.touches[0];
      } else {
        event = e;
      }

      const currentCellX = (event.x / pixelsOnCell) >>> 0;
      const currentCellY = (event.y / pixelsOnCell) >>> 0;
      positions.mouseX = currentCellX;
      positions.mouseY = currentCellY;
      zoomContext.clearRect(0, 0, canvas.width, canvas.height);
      if (!pressed) return;
      if (
        currentCellX !== positions.prevX ||
        currentCellY !== positions.prevY
      ) {
        positions.prevX = currentCellX;
        positions.prevY = currentCellY;
        memoryBuffer.copyWithin(0, size, size + size);
        exports.drawAtPos(
          event.x >>> SIZE_BIT_OFFSET,
          event.y >>> SIZE_BIT_OFFSET
        );
      }
    })
  );
});

function rgb2bgr(rgb) {
  return ((rgb >>> 16) & 0xff) | (rgb & 0xff00) | ((rgb & 0xff) << 16);
}
