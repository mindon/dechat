import { t$ } from "./t$.js";

import { assertEquals } from "https://deno.land/std@0.183.0/testing/asserts.ts";

Deno.test("hello world #1", () => {
  (t$ as any).got({
    hello: { zh: "世界", en: "world" },
    world: { zh: "{{1}}世界{{0}}", en: "{{0}}world{{1}}" },
    err_1: { zh: "{{0}}你好", en: "hello{{0}}" },
  });

  assertEquals(t$`hello`, "hello");
  assertEquals(t$`${"en"}hello`, "world");
  assertEquals(t$`${"zh"}hello`, "世界");

  assertEquals(t$`${"en"}world`, "world");
  assertEquals(t$`${"en"}${"x"}world`, "xworld");
  assertEquals(t$`${"en"}${"x"}${"y"}world`, "xworldy");
  assertEquals(t$`${"zh"}${"x"}${"y"}world`, "y世界x");
  assertEquals(t$`${"zh"}${"x"}world`, "世界x");
  assertEquals(t$`${"zh"}world`, "世界");
  assertEquals(t$`${"zh"}err_${1}`, "你好");
  assertEquals(t$`${"zh"}${"x"}err_${1}`, "x你好");
  assertEquals(t$`${"en"}${"x"}err_${1}`, "hellox");
  assertEquals(t$`${"en"}${"x"}${"y"}err_${1}`, "hellox");
  assertEquals(t$`${"zh"}${"x"}${"y"}err_${1}`, "x你好");
});
