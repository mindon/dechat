const win = globalThis || {};

export function q$(id, doc, clickFn) {
  if (doc instanceof Function) {
    clickFn = doc;
    doc = document;
  }
  const t = (doc || document).querySelector(id);
  if (clickFn && t) {
    t.addEventListener("click", clickFn);
  }
  return t;
}
win.q$ = q$;

export function q$$(id, doc, cb) {
  if (doc instanceof Function) {
    cb = doc;
    doc = document;
  }
  const l = (doc || document).querySelectorAll(id);
  if (cb) [].slice.apply(l).forEach(cb);
  return l;
}
win.q$$ = q$$;

const doc = document;
// copy fallback
function fallback(msg, cb) {
  let t;
  let text = msg;
  const aid = !text.tagName;
  if (aid) {
    t = doc.createElement("textarea");
    t.value = text;
    t.readOnly = true;
    t.style.top = "0";
    t.style.left = "0";
    t.style.height = "1px";
    t.style.width = "1px";
    t.style.position = "fixed";

    doc.body.appendChild(t);
  } else {
    t = text;
    text = t.value;
  }
  t.setSelectionRange(0, Number.MAX_VALUE);
  t.select();

  setTimeout(() => {
    t.focus();
    try {
      const ret = doc.execCommand("copy");
      if (cb) cb(ret);
    } catch (err) {
      if (cb) cb(false, err);
    }

    if (aid) {
      doc.body.removeChild(t);
    }
  }, 50);
}

// copy text
export function copix(msg, cb) {
  try {
    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      if (result.state !== "granted" && result.state !== "prompt") {
        fallback(msg, cb);
        return;
      }
      const clipr = navigator.clipboard;
      if (!clipr) {
        fallback(msg, cb);
        return;
      }
      clipr.writeText(msg.value || msg || "").then((d) => {
        cb && cb(d);
      }, (err) => {
        fallback(msg, cb);
      });
    }).catch((err) => {
      fallback(msg, cb);
    });
  } catch (err) {
    fallback(msg, cb);
  }
}
win.copix = copix;

export async function po$t(list, cb, { api, headers, streaming }) {
  const body = JSON.stringify(list);
  const ctl = win.AbortController ? new AbortController() : {};
  const signal = ctl.signal;

  const resp = await fetch(api, {
    method: "POST",
    signal,
    mode: "cors",
    headers: [["Content-Type", "application/json"]].concat(
      (headers instanceof Function ? headers() : headers) || [],
    ),
    body,
  });

  if (resp.status >= 400) {
    let c = await resp.text();
    if (c.startsWith("{")) {
      try {
        const d = JSON.parse(c);
        const { error = {}, err = "" } = d;
        if (err) {
          c = err;
        } else {
          if (typeof error === "string") {
            c = error;
          } else if (error.message) {
            c = error.message;
          }
        }
      } catch (err) {}
    }
    cb({ err: `${resp.status}: ${c || resp.statusText}: ` });
    return;
  }

  if (!streaming) {
    cb(await resp.json());
    return;
  }

  const pipe = resp.body.pipeThrough(new TextDecoderStream());
  const reader = pipe.getReader();
  let canceled = false;
  const cancel = () => {
    ctl.abort?.();
    canceled = true;
    cb(['{"error":{"message":"~canceled"}}'], streaming);
  };
  while (true) {
    if (canceled) break;
    const { value, done } = await reader.read();
    if (done) break;
    cb(value.split("data: "), streaming, cancel);
  }
}
win.po$t = po$t;

// storage
export function data$(name, d) {
  if (d === undefined) {
    return localStorage.getItem(name);
  }
  if (d === false) {
    localStorage.removeItem(name);
    return;
  }
  localStorage.setItem(name, d);
}
win.data$ = data$;

// openai
const q = new URL(`about:blank${location.search}`).searchParams;
const _DONE = "[DONE]";
export const aichat = {
  url: "/chat?stream",
  streaming: true,
  headers: () => {
    const d = [];
    const prefix = "x-openai";
    const ik = data$("ik");
    if (ik && ik.length > 8) d.push([`${prefix}-key`, ik]);
    if (q.has("vip")) {
      const vip = q.get("vip");
      if (vip && /^\w{1,16}$/.test(vip)) d.push([`${prefix}-vip`, vip]);
      q.delete("vip");
    }
    "lang,speech".split(",").forEach((name) => {
      if (q.has(name)) q.delete(name);
    });
    const qs = q.toString();
    if (qs) d.push([`${prefix}-args`, btoa(qs)]);
    return d;
  },
  got: (d, streaming) => {
    if (d && d.err) {
      return { err: d.err };
    }
    if (!streaming) {
      const { choices = [] } = d || {};
      const { content } = choices.length > 0 && choices[0] || {};
      if (!content) {
        return { err: d.error && d.error.message || "unknown error" };
      }
      return { cell: { content } };
    }

    let fin = false;
    const content = d.map((v) => {
      if (!v) return "";
      if (!v.startsWith("{")) {
        fin = v.trim() == _DONE;
        return fin ? "" : v;
      }
      const z = JSON.parse(v.trim());
      const { error = {} } = z;
      if (error.message) {
        fin = -2;
        return `[!ERR] ${error.message}`;
      }
      return z;
    }).map((v) =>
      !v
        ? ""
        : (typeof v === "string"
          ? v
          : v.choices && v.choices[0].delta.content || "")
    ).join("");
    return { fin, cell: { content } };
  }, // end of got
};

let _lastSpeech = "";
win.addEventListener("beforeunload", () => {
  speechSynthesis.cancel();
});

document.addEventListener("speak", (evt) => {
  const text = evt.detail;
  if (_lastSpeech != text) {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    _lastSpeech = text;
    return;
  }
  if (speechSynthesis.speaking) {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    } else {
      speechSynthesis.pause();
    }
  } else {
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
});

const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition ||
  Function;
// const SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
// const SpeechRecognitionEvent =
//   window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = q.has("lang") ? q.get("lang") || "zh-CN" : "zh-CN";
recognition.interimResults = false;
recognition.maxAlternatives = 1;
recognition.onresult = (evt) => {
  const text = evt.results[0][0].transcript;
  if (text) {
    win.dispatchEvent(new CustomEvent("speech-text", { detail: text }));
  }
};
if (q.has("lang")) {
  q.remove("lang");
}

let speechTid;
export function speechListen(starting = true) {
  speechTid && clearTimeout(speechTid);
  if (starting === false) {
    recognition.stop();
    return;
  }
  recognition.abort();
  speechTid = setTimeout(() => {
    recognition.start();
  }, 500);
}
window.speechListen = speechListen;

document.addEventListener("keydown", (e) => {
  if (e.altKey) {
    speechListen();
  }
});
document.addEventListener("keyup", (e) => {
  speechListen(false);
});
