class State {
  RGB_ALIVE: number;
  RGB_DEAD: number;
  SIZE_BIT_OFFSET: number;
  SUB_WIDTH: number;
  ZOOM_CANVAS_OFFSET: number;
  positions: Positions;

  size: number;
  byteSize: number;
  width: null | number;
  height: null | number;
  isRunning: boolean;
  pressed: boolean;

  constructor() {
    this.SUB_WIDTH = 50; // size of the sub image for the zoom canvas
    this.ZOOM_CANVAS_OFFSET = 17_600; // zooming offset for the zoom canvas
    this.positions = {
      prevX: null,
      prevY: null,
      mouseX: 0,
      mouseY: 0,
    };
  }

  set<TKey extends keyof State>(name: TKey, value: this[TKey]) {
    return (this[name] = value);
  }
}

interface Positions {
  prevX: null | number;
  prevY: null | number;
  mouseX: number;
  mouseY: number;
}

const state = new State();

export default state;
