import loader from "@assemblyscript/loader";

type LoaderExport = loader.ASUtil & Record<string, unknown>;
export interface IExports extends LoaderExport {
  recalculateMemory: CallableFunction;
  fillRandomly: CallableFunction;
  drawAtPos: CallableFunction;
  step: CallableFunction;
  init: CallableFunction;
}
