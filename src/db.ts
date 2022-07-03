import Dexie from "dexie";
export const db = new Dexie("GOL") as Dexie & {
  saves: Dexie.Table<SavesTable>;
};

interface SavesTable {
  id?: string;
  data: Uint32Array;
  stamp: string;
}

db.version(1).stores({
  saves: `
      ++id,
      data,
      stamp
    `,
});
