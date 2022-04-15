export interface IExports extends WebAssembly.Exports {
  recalculateMemory: CallableFunction;
  fillRandomly: CallableFunction;
  drawAtPos: CallableFunction;
  step: CallableFunction;
}
