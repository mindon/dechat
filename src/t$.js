const vxp = /\{\{(\d+)\}\}/g;

const win = globalThis;
let lib$ = {};

// transform with lang and args
export function t$(parts, ...args) {
  const langs = lib$ || {};
  let s = "";
  if (args.length <= 1) {
    s = parts.join("");
    const d = langs[s];
    if (!d || args.length === 0) {
      return s.replace(vxp, "");
    }
    return (d[args[0]] || s).replace(vxp, "");
  }

  let ki = 0;
  parts.forEach((v, i) => {
    if (v.length === 0) return;
    ki = i;
  });
  const vars = args.slice(1, ki);
  const d = parts.slice(ki);
  args.slice(ki).forEach((v, i) => {
    d.splice(i + 1, 0, v);
  });
  s = d.join("");
  if (args.length === 0) {
    return s.replace(vxp, "");
  }
  const x = langs[s];
  if (!x || !x[args[0]]) {
    return s;
  }
  return x[args[0]].replace(vxp, (s, n) => {
    return vars[parseInt(n, 10)] || "";
  });
}

// got id - translations
let stored = false;
t$.got = (d, global = false) => {
  const old = lib$ || {};
  Object.keys(d).forEach((k) => {
    old[k] = old[k] ? { ...old[k], ...d[k] } : { ...d[k] };
  });
  lib$ = old;
  if (global || stored) {
    localStorage.setItem("lib$", JSON.stringify(lib$));
  }
};

if (new URL(import.meta.url).searchParams.has("global")) {
  stored = true;
  // init load from localStorage
  const raw = localStorage.getItem("lib$");
  if (raw) {
    try {
      lib$ = JSON.parse(raw);
    } catch (err) {}
  }
}
win.t$ = t$;
