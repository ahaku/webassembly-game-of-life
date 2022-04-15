// @ts-ignore: decorator
@external('imports', 'log')
declare function log(x: i32): void
import { EXAMPLE_COLOR } from "./config";

const NO_COLOR = 0x0

var width: i32, height: i32;

/** Gets an input pixel in the range [0, s]. */
// @ts-ignore: decorator
@inline
function get(x: u32, y: u32): u32 {
  return load<u32>(toPointer(x, y));
}

/** Sets an output pixel in the range [s, 2*s]. */
// @ts-ignore: decorator
@inline
function set(x: i32, y: i32, v: u32 = EXAMPLE_COLOR): void {
  store<u32>(toPointer(x, y), v);
}

export function init(w: i32, h: i32): void {
  width = w;
  height = h;
}

function toPointer(x: i32, y: i32): i32 {
  return (y * width + x) * 4;
}

/** Computes the distance between two pixels. */
function distance(x1: i32, y1: i32, x2: f32, y2: f32): f32 {
  var dx = <f32>x1 - x2;
  var dy = <f32>y1 - y2;
  return Mathf.sqrt(dx * dx + dy * dy);
}

export function drawAtPos(x: i32, y: i32): void {
  const self = get(x, y) 

  if (self === EXAMPLE_COLOR) {
    set(x, y, NO_COLOR);
  } else {
    set(x, y);
  }
}

export function fillRandomly(): void {
  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const color = Math.random() > 0.1 ? NO_COLOR : EXAMPLE_COLOR
      set(x, y, color)
    }
  }
}

export function step(): void {
  fillRandomly()
}

export function recalculateMemory (w: i32, h: i32 ): void {
  init(w, h)

  const byteSize = ((w * h) * 2) << 2
  const expected = <i32>((byteSize + 0xffff) & ~0xffff) >>> 16
  const actual = memory.size()
  if (expected > actual) memory.grow(expected - actual)

  // step()
}
