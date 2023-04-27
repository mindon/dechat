// !bundle=off
import {
  css,
  html,
  LitElement,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

import { aichat, data$, q$, q$$ } from "./de.js";
import "./de-chat.js";

const doc = document;
const a = doc.createElement("a");

// chat stage
export class QiChat extends LitElement {
  static properties = {
    api: { type: Object },
    speech: { type: Boolean },
    _available: { type: Boolean },
    _ik: { type: String },
    _npp: { type: Number },
    _start: { type: Number },
    _total: { type: Number },
    plugins: { type: Array },
  };

  constructor() {
    super();
    this._available = true;
    this._ik = data$("ik");
    this._start = 0;
    this._npp = 3;
    this._total = 0;
    this.api = aichat; // {url, streaming, headers:[[]...], got: (d, streaming) => {fin, cell, err?}}
    this.plugins = [];
  }

  firstUpdated() {
    const c = this.renderRoot.host;
    c.addEventListener("de-changed", async (evt) => {
      const { detail: key } = evt;
      const data = [];
      q$$("de-chat", this.renderRoot, async (q) => {
        if (q.cells?.length > 0 && (!key || q.key == key)) {
          data.push([q.cells, q.key]);
        }
      });
      if (key && data.length == 0) {
        db$.do((store) => store.delete(key));
        this._total -= 1;
        this._start -= 1;
      } else {
        if (this._total < this._start) {
          this._total = this._start;
        }
      }
      data.length > 0 && await db$.do((store) =>
        Promise.all(
          data.filter((d) => !!d[1]).concat(data.filter((d) => !d[1]))
            .map(([cells, key]) => store.put(cells, key)),
        )
      );
      this._available = await db$.count() > 0;
    });

    c.addEventListener("de-new", () => {
      this.new();
    });

    c.addEventListener("de-focus", (evt) => {
      q$$("de-chat", this.renderRoot, (q) => {
        if (q == evt.detail) return;
        q.classList.add("fin");
      });
    });

    this.more();
    this.new();

    window.addEventListener("beforeunload", (evt) => {
      let busying = false;
      q$$("de-chat", this.renderRoot, (q) => {
        if (busying) return;
        if (q._waiting && q._waiting.length > 0) {
          busying = true;
        }
      });
      if (busying) {
        evt.preventDefault();
        return (evt.returnValue = "还有对话没有结束，确定离开？");
      }
    }, { capture: true });
  }

  // load logs
  load(raw, total) {
    if (total !== undefined && typeof total === "number") {
      this._total = total;
      this._start = 0;
    }
    let last;
    if (total instanceof HTMLElement) {
      last = total;
      this._start += this._npp;
    }
    const keys = [];
    const data = raw.filter((d) =>
      d &&
      (d.key && (d.value || d.value.length > 0) || d.length > 0)
    ).map((d, i) => {
      const { key, value } = d;
      if (!key && !value) return d;
      keys[i] = key;
      return d.value;
    }); // old [[{}]], new [{key, value:[{}]}]
    if (!data || data.length == 0) {
      return false;
    }

    let qi = q$("#ia", this.renderRoot);
    if (last) {
      qi = last;
    } else {
      last = qi.previousElementSibling;
      if (last && last.tagName === "DE-CHAT" && (!last.active())) {
        qi = last;
      }
    }
    const { _total = 0 } = this;
    data.forEach((d, i) => {
      const c = doc.createElement("de-chat");
      c.key = keys[i] || (_total + i);
      c.className = "fin";
      c.cells = d;
      this.renderRoot.insertBefore(c, qi);
    });
    this._available = true;
    return true;
  }

  // new chat
  new() {
    const ia = q$("#ia", this.renderRoot);
    let last = ia.previousElementSibling;
    if (!last || last.tagName !== "DE-CHAT" || last.active()) {
      if (last) last.classList.add("fin");
      const c = doc.createElement("de-chat");
      this.renderRoot.insertBefore(c, ia);
      last = c;
    }
    last.focus();
  }

  // local customized key
  _local(evt) {
    const key = prompt(`使用自己的OpenAI Key
  【注意】本站不存储，风险自负。（建议存服务器）`);
    if (!key) return;
    if (key === "CLEAR") {
      data$("ik", false);
      this._ik = "";
      return;
    }
    this._ik = btoa(key.trim());
    data$("ik", btoa(key.trim()));
  }

  // clear logs
  async clear() {
    if (await db$.count() === 0 || !confirm("确认要清除所有记录？")) return;
    q$$("de-chat", this.renderRoot, (t) => {
      if (!t.active()) return;
      t.parentNode.removeChild(t);
    });
    db$.do((store) => store.clear());
    this._available = false;
    this.new();
  }

  // import logs
  _loadx = (evt) => {
    const files = evt.target.files;
    if (!window.FileReader || !files || files.length == 0) {
      return;
    }

    const r = new FileReader();
    r.onload = (evt) => {
      const raw = evt.target.result;
      try {
        const data = JSON.parse(raw).filter((d) => d && d.length > 0);
        if (this.load(data)) {
          if (data.length > 0) this._start += data.length;
          this.renderRoot.host.dispatchEvent(new CustomEvent("de-changed", {}));
        }
      } catch (err) {
        alert(err);
      }
      this.new();
    };
    r.readAsText(files[0]);
  };

  more(evt) {
    (async () => {
      try {
        const { result: raw, total = 0 } = await db$.query({
          start: this._start + (evt ? this._npp : 0),
          n: this._npp,
        });
        if (raw) {
          this.load(
            raw.reverse(),
            evt ? q$("#mymore", this.renderRoot).nextElementSibling : total,
          );
        } else {
          this._available = false;
        }
      } catch (err) {
        console.log(err);
      }
    })();
  }

  // export logs
  async download() {
    let raw;
    try {
      raw = JSON.stringify(await db$.query().map((d) => d.value));
    } catch (err) {}
    if (!raw) {
      alert("没有记录数据");
      return;
    }
    const now = new Date();
    a.download = `deqi-ai-chat_${
      [
        now.getFullYear(),
        `0${now.getMonth() + 1}`.slice(-2),
        `0${now.getDate()}`.slice(-2),
      ].join("")
    }.json`;
    a.href = `data:application/json;base64,${
      btoa(
        unescape(encodeURIComponent(raw)),
      )
    }`;
    a.click();
  }

  ask(text) {
    const t = q$("de-chat:not(.fin)", this.renderRoot);
    if (t) t.ask(text, this.speech ? -1 : undefined);
  }

  render() {
    return html`<div id="mymore" style="text-align: center;margin-bottom:.5rem"><a class="btn ${
      this._start < this._total - this._npp ? "" : "none"
    }" @click=${this.more}>${
      this._total - this._npp - this._start
    }<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
  </svg></a></div><div id="ia" style="text-align: center;position:relative;display: flex; align-items: center;">
    <a class="btn" id="myimport" @click=${() => {
      q$("#myfile", this.renderRoot).click();
    }} title="导入记录"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload" viewBox="0 0 16 16">
      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
    </svg></a>
    <a class="btn ${this._ik ? "alarm" : ""}" id="mykey" @click=${this._local}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-key-fill" viewBox="0 0 16 16">
        <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
      </svg>
    </a>
    <a class="btn" id="newchat" @click=${this.new}>新话题 &nbsp; <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-square-text-fill" viewBox="0 0 16 16">
    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a1 1 0 0 0-.8.4l-1.9 2.533a1 1 0 0 1-1.6 0L5.3 12.4a1 1 0 0 0-.8-.4H2a2 2 0 0 1-2-2V2zm3.5 1a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9zm0 2.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9zm0 2.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5z"/>
  </svg></a>
  <a class="btn" id="myempty"  ?disabled=${!this
      ._available} @click=${this.clear} title="清空记录"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg></a>
  <a class="btn" id="myexport" ?disabled=${!this
      ._available} @click=${this.download} title="导出记录"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
  </svg></a>
</div><input id="myfile" type="file" accept=".json" style="display:none" @change=${this._loadx}>`;
  }

  static styles = css`
:host {
  display: block;
  width: 100%;
  margin: 2rem auto;
}
.btn {
  align-items: center;
  appearance: none;
  background-color: #fff;
  border-radius: 1rem;
  border-style: none;
  box-shadow: rgba(0, 0, 0, .2) 0 3px 5px -1px,rgba(0, 0, 0, .14) 0 6px 10px 0,rgba(0, 0, 0, .12) 0 1px 18px 0;
  box-sizing: border-box;
  color: #3c4043;
  cursor: pointer;
  display: inline-flex;
  fill: currentcolor;
  justify-content: center;
  letter-spacing: .25px;
  line-height: normal;
  max-width: 100%;
  overflow: visible;
  padding: .25rem 1rem;
  position: relative;
  text-align: center;
  text-transform: none;
  transition: box-shadow 280ms cubic-bezier(.4, 0, .2, 1),opacity 15ms linear 30ms,transform 270ms cubic-bezier(0, 0, .2, 1) 0ms;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  width: auto;
  will-change: transform,opacity;
  z-index: 0;
  --a: rgba(60, 64, 67, .3);
  --b: rgba(60, 64, 67, .15);
}
#newchat {
  margin: 0 auto;
  color: #008a0e;
}
#mykey {
  padding: 4px!important;
  margin-left: .25rem;
}
#myempty {
  padding: 4px!important;
  margin-right: .25rem;
}
.btn[disabled] {
  opacity: .5;
  pointer-events: none;
}
.alarm {
  color: #f00;
}
.none {
  display: none;
}
`;
}
customElements.define("qi-chat", QiChat);
