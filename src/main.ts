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
import state from "./state";

state.set("isRunning", false);
state.set("RGB_ALIVE", 0xfd9925);
state.set("RGB_DEAD", 0x212121);
const bcr = canvas.getBoundingClientRect();
runButton.innerHTML = "Start";
const toggleRun = () => {
  state.set("isRunning", !state.isRunning);
  runButton.innerHTML = state.isRunning ? "Stop" : "Start";
  stepButton.disabled = state.isRunning;
};
runButton.addEventListener("click", toggleRun);

state.set("SIZE_BIT_OFFSET", 4); // shifts all the bits

// 2px per cell
state.set("width", bcr.width >>> state.SIZE_BIT_OFFSET);
state.set("height", bcr.height >>> state.SIZE_BIT_OFFSET);
state.set("size", state.width * state.height);
state.set("byteSize", (state.size * 2) << 2); // 4b per cell
canvas.width = state.width;
canvas.height = state.height;
context.imageSmoothingEnabled = false;
zoomContainer.style.width = "200px";
zoomContainer.style.height = "200px";
zoomCanvas.width = state.width;
zoomCanvas.height = state.height;
zoomContext.imageSmoothingEnabled = false;

const memory = new WebAssembly.Memory({
  initial: ((state.byteSize + 0xffff) & ~0xffff) >>> 16,
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
    BGR_ALIVE: rgb2bgr(state.RGB_ALIVE) | 1, // little endian, LSB must be set
    BGR_DEAD: rgb2bgr(state.RGB_DEAD) & ~1, // little endian, LSB must not be set
  },
  // Math,
};
loader.instantiate(fetch("build/debug.wasm"), importObject).then((module) => {
  const exports = module.exports as IExports;
  state.set("pressed", false);

  exports.init(state.width, state.height);

  const memoryBuffer = new Uint32Array(memory.buffer);

  const doStep = () => {
    memoryBuffer.copyWithin(0, state.size, state.size + state.size);
    exports.step();
  };
  stepButton.onclick = doStep;
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
      clearCanvas();
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

  dropButton.onclick = () => {
    db.saves.clear().then(() => {
      updateSelectOptions();
    });
  };

  (function update() {
    setTimeout(update, 1000 / 30);
    if (state.isRunning) {
      memoryBuffer.copyWithin(0, state.size, state.size + state.size); // copy output to input
      exports.step(); // perform the next step
    }
  })();
  const canvasRatio = canvas.width / canvas.height;
  const pixelsOnCell = canvas.clientWidth / state.width;

  // Keep rendering the output at [size, 2*size]
  const imageData = context.createImageData(state.width, state.height);
  const argb = new Uint32Array(imageData.data.buffer);

  (function render() {
    requestAnimationFrame(render);
    argb.set(memoryBuffer.subarray(state.size, state.size + state.size)); // copy output to image buffer
    context.putImageData(imageData, 0, 0); // apply image buffer

    zoomContext.drawImage(
      canvas,
      state.positions.mouseX - 2,
      state.positions.mouseY - 2,
      state.SUB_WIDTH,
      state.SUB_WIDTH * canvasRatio,
      0,
      0,
      canvas.width + (state.ZOOM_CANVAS_OFFSET >>> state.SIZE_BIT_OFFSET),
      canvas.width + (state.ZOOM_CANVAS_OFFSET >>> state.SIZE_BIT_OFFSET)
    );
  })();

  [
    [canvas, "mousedown"],
    [canvas, "touchstart"],
  ].forEach((eh: [HTMLCanvasElement, string]) =>
    eh[0].addEventListener(eh[1], () => (state.pressed = true))
  );
  [
    [document, "mouseup"],
    [document, "touchend"],
  ].forEach((eh: [Document, string]) =>
    eh[0].addEventListener(eh[1], () => {
      state.pressed = false;
      state.positions.prevX = null;
      state.positions.prevY = null;
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
      state.positions.mouseX = currentCellX;
      state.positions.mouseY = currentCellY;
      zoomContext.clearRect(0, 0, canvas.width, canvas.height);
      if (!state.pressed) return;
      if (
        currentCellX !== state.positions.prevX ||
        currentCellY !== state.positions.prevY
      ) {
        state.positions.prevX = currentCellX;
        state.positions.prevY = currentCellY;
        memoryBuffer.copyWithin(0, state.size, state.size + state.size);
        exports.drawAtPos(
          event.x >>> state.SIZE_BIT_OFFSET,
          event.y >>> state.SIZE_BIT_OFFSET
        );
      }
    })
  );

  document.addEventListener("keypress", (e) => {
    const { code } = e;
    switch (code) {
      case "Space":
        toggleRun();
        break;
      case "KeyS":
        doStep();
        break;
      default:
        break;
    }
  });
});

function rgb2bgr(rgb) {
  return ((rgb >>> 16) & 0xff) | (rgb & 0xff00) | ((rgb & 0xff) << 16);
}
