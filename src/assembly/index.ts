// see: https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life

// Configuration imported from JS
import { BGR_ALIVE, BGR_DEAD } from "./config";

// @ts-ignore: decorator
@external('imports', 'log')
declare function log(x: i32): void

var width: i32, height: i32, offset: i32;

/** Gets an input pixel in the range [0, s]. */
// @ts-ignore: decorator
@inline
function get(x: u32, y: u32): u32 {
  return load<u32>((y * width + x) << 2);
}

/** Sets an output pixel in the range [s, 2*s]. */
// @ts-ignore: decorator
@inline
function set(x: u32, y: u32, v: u32): void {
  store<u32>((offset + y * width + x) << 2, v);
}

/** Initializes width and height. Called once from JS. */
export function init(w: i32, h: i32): void {
  width  = w;
  height = h;
  offset = w * h;

  // Start by filling output with random live cells.
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      let c = Math.random() > 0.1
        ? BGR_DEAD  & 0x00ffffff
        : BGR_ALIVE | 0xff000000;
      set(x, y, c);
    }
  }
}

export function step(): void {
  var w = width,
      h = height;

  var maxH = h - 1, // h - 1
      maxW = w - 1; // w - 1

  // The universe of the Game of Life is an infinite two-dimensional orthogonal grid of square
  // "cells", each of which is in one of two possible states, alive or dead.
  for (let y = 0; y < h; ++y) {
    let yAbove = y == 0 ? maxH : y - 1,
        yBelow = y == maxH ? 0 : y + 1;
    for (let x = 0; x < w; ++x) {
      let xLeft = x == 0 ? maxW : x - 1,
          xRight = x == maxW ? 0 : x + 1;

      // Every cell interacts with its eight neighbors, which are the cells that are horizontally,
      // vertically, or diagonally adjacent. Least significant bit indicates alive or dead.
      let aliveNeighbors = (
        (get(xLeft, yAbove) & 1) + (get(x, yAbove) & 1) + (get(xRight, yAbove) & 1) +
        (get(xLeft, y  ) & 1)                     + (get(xRight, y  ) & 1) +
        (get(xLeft, yBelow) & 1) + (get(x, yBelow) & 1) + (get(xRight, yBelow) & 1)
      );

      let self = get(x, y);
      if (self & 1) {
        // A live cell with 2 or 3 live neighbors lives on the next generation.
        if ((aliveNeighbors & 0b1110) == 0b0010) {
           set(x, y, BGR_ALIVE | 0xff000000)
        } 
        // A live cell with fewer than 2 or more than 3 live neighbors dies.
        else set(x, y, BGR_DEAD | 0xff000000);
      } else {
        // A dead cell with exactly 3 live neighbors becomes a live cell.
        if (aliveNeighbors == 3) set(x, y, BGR_ALIVE | 0xff000000);

        else set(x, y, BGR_DEAD | 0xff000000)
      }
    }
  }
}

export function drawAtPos(x: u32, y: u32): void {
  const self = get(x, y)
  if (self & 1) {
    set(x, y, BGR_DEAD  & 0x00ffffff)
  } else {
    set(x, y, BGR_ALIVE | 0xff000000)
  }
}