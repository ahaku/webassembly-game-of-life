import { db } from "./db";

export const canvas = document.querySelector("canvas") as HTMLCanvasElement;
export const context = canvas.getContext("2d") as CanvasRenderingContext2D;
export const runButton = document.querySelector(
  ".run-btn"
) as HTMLButtonElement;
export const stepButton = document.querySelector(
  ".step-btn"
) as HTMLButtonElement;
export const saveButton = document.querySelector(
  ".save-btn"
) as HTMLButtonElement;
export const savesSelect = document.querySelector(
  "#saves"
) as HTMLSelectElement;
export const clearButton = document.querySelector(
  ".clear-btn"
) as HTMLButtonElement;
export const dropButton = document.querySelector(
  ".drop-btn"
) as HTMLButtonElement;

export const updateSelectOptions = () => {
  db.transaction("r", db.saves, async () => {
    const saves = await db.saves.toArray();
    savesSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.selected = true;
    defaultOption.hidden = true;
    defaultOption.disabled = true;
    defaultOption.value = "";
    savesSelect.appendChild(defaultOption);

    saves.forEach(({ stamp, id }) => {
      const optionNode = document.createElement("option");
      optionNode.value = id;
      optionNode.text = `#${id} ${stamp}`;
      savesSelect.appendChild(optionNode);
    });

    defaultOption.text = saves.length ? "Choose one" : "Save something";
    savesSelect.disabled = saves.length < 1;
  });
};
