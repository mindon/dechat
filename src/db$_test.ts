import { indexedDB } from "https://deno.land/x/indexeddb@v1.1.0/ponyfill_memory.ts";
(globalThis as any).indexedDB = indexedDB;
import { db$ } from "./de.js";
import { assertEquals } from "https://deno.land/std@0.183.0/testing/asserts.ts";

Deno.test("db$", async () => {
  // db$("de", "chat", (store: any, err?: string) => {
  //   assertEquals(err, undefined);
  //   assertEquals(!!store, true);
  //   // console.log(store);
  // });

  const key = await db$.do((store: any) => {
    store.add({ world: 456 });
    store.put({ world: 789 });
    store.put({ world: 901 });
    store.put({ world: 12 });
    store.put({ world: 34 });
    store.put({ world: 56 });
    return store.put({ world: 123 }, 1);
  });

  assertEquals(key, 1);

  {
    const detail = await db$.get(1);
    assertEquals(detail, { world: 123 });
  }

  {
    const total = await db$.count();
    assertEquals(total, 6);
  }

  {
    const { result, total } = await db$.query({ start: 2 });
    assertEquals(total, 6);
    assertEquals(result.length, 4);
    assertEquals(result[0], { key: 4, value: { world: 12 } });
  }

  {
    const { result, total } = await db$.query();
    assertEquals(total, 6);
    assertEquals(result.length, 5);
    assertEquals(result[0], { key: 6, value: { world: 56 } });
  }

  {
    try {
      const { result, total } = await db$.query({ id: "dechat", name: "none" });
      console.log(result, total);
    } catch (err) {
      assertEquals(err, "no none data");
    }
  }
});
