//  !bundle=off
import {
  css,
  html,
  LitElement,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

import { t$ } from "./t$.js";
import { aichat, copix, po$t, q$, q$$ } from "./de.js";

const dots = "❞";
t$.got({
  ApiErr: { zh_CN: "须正确设置api", en_US: "proper api required" },
  Continue: { zh_CN: "继续" },
  Remove: { zh_CN: "删除此记录？", en_US: "Remove this log?" },
  Copy: { zh_CN: "拷贝" },
  Delete: { zh_CN: "删除" },
  Session: {
    zh_CN: "续聊模式，限{{0}}字符",
    en_US: "session continue, limits to {{0}} character(s)",
  },
});

// DeChat Component
export class DeChat extends LitElement {
  static properties = {
    cells: { type: Array },
    api: { type: Object },
    lang: { type: String },
    for: { type: String },
    _waiting: { type: Array },
    _stage: { type: HTMLElement },
  };

  constructor() {
    super();
    this.lang = "zh_CN";
  }

  firstUpdated() {
    let _stage = this.for && q$(this.for) ||
      this.renderRoot.host.parentNode;
    if (_stage.host) _stage = _stage.host;
    this._stage = _stage;
    this.api = _stage.api || globalThis.deAPI || aichat;
  }

  ask(something) {
    const { cells = [], api = aichat } = this;
    cells.push({ role: "user", content: something });
    const { url, streaming, headers, got } = api;
    if (!url || !got) {
      cells.push({ role: "assistant", content: t$`${this.lang}ApiErr` });
      this.cells = cells.slice(0);
      return;
    }
    this.cells = cells.slice(0);
    this._waiting = [dots];

    po$t(cells, (c, streaming) => {
      const { fin = !streaming, err, cell } = got(c, streaming);
      const role = `assistant${err ? " err" : ""}`;
      if (err) {
        this.renderRoot.host.classList.add("fin");
      }
      if (!streaming || err) {
        cells.push({
          role,
          ...cell,
          ...(err ? { content: html`[ERR] ${err}` } : {}),
        });
        this.cells = cells.slice(0);
        this._waiting = [];
        return;
      }
      let { _waiting } = this;
      if (!_waiting) {
        _waiting = [];
      }
      let s = cell && cell.content;
      if (_waiting.length == 0 || _waiting[0] == dots) {
        _waiting = [s];
      } else {
        _waiting.push(s);
      }
      if (fin !== false) {
        cells.push({ role, ...cell, content: _waiting });
        this.cells = cells;
        this._waiting = [];
        this.notify(`de-${err ? "new" : "changed"}`);
        return;
      }
      this._waiting = _waiting;
    }, { api: url, streaming, headers });
  }

  next() {
    if (this._waiting && this._waiting.length > 0) return;
    const { renderRoot } = this;
    const mysay = q$("#mysay", renderRoot);
    if (/^\s*$/.test(mysay.value)) {
      mysay.focus();
      return;
    }
    this.ask(mysay.value.trim());
    this.input("");
  }

  input(c) {
    const { renderRoot } = this;
    const mysay = q$("#mysay", renderRoot);
    if (c || typeof c === "string") mysay.value = c.trim();
    setTimeout(() => {
      q$("#mysay", renderRoot).focus();
    }, 300);
  }

  notify(name, detail) {
    this._stage.dispatchEvent(
      new CustomEvent(name, { detail }),
    );
  }

  focus() {
    const { renderRoot } = this;
    const p = this._stage;
    q$$("de-chat", p, (t) => {
      const cl = t.classList;
      if (cl.contains("fin")) return;
      cl.add("fin");
    });
    if (renderRoot.host.classList.contains("fin")) {
      renderRoot.host.classList.remove("fin");
    }
    this.input();
  }

  _enter(evt) {
    if (evt.key == "Enter") {
      this.next();
    }
  }

  _delete(evt) {
    const t = evt.target;
    const failed = t.parentElement.classList.contains("err");
    if (!failed && !confirm(t$`${this.lang}Remove`)) {
      return;
    }
    const { i } = t.dataset;
    this.cells.splice(parseInt(i, 10) - 1, 2);
    if (this.cells.length > 0) {
      this.requestUpdate();
    } else {
      const p = this.renderRoot.host.parentElement;
      p.removeChild(this.renderRoot.host); // may left something else
    }
    if (!failed) {
      this.notify("de-changed");
    }
  }

  render() {
    const { max = 4096 } = this.api || {};
    const { cells = [], _waiting } = this;
    const imax = cells.length;
    const body = JSON.stringify(cells);
    return html`${
      imax > 0
        ? cells.map((cell, i) => {
          const { role, content } = cell;
          const cc = i == imax - 1 && body.length < max &&
            !role.includes("err");
          return html`<div class="${role}"><p>${content}</p>${
            role.includes("assistant")
              ? html`${
                cc
                  ? html`<a class="btn continue" title="${t$`${this.lang}Continue`} " @click=${() =>
                    this.focus()}>
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-square-quote-fill" viewBox="0 0 16 16">
  <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a1 1 0 0 0-.8.4l-1.9 2.533a1 1 0 0 1-1.6 0L5.3 12.4a1 1 0 0 0-.8-.4H2a2 2 0 0 1-2-2V2zm7.194 2.766a1.688 1.688 0 0 0-.227-.272 1.467 1.467 0 0 0-.469-.324l-.008-.004A1.785 1.785 0 0 0 5.734 4C4.776 4 4 4.746 4 5.667c0 .92.776 1.666 1.734 1.666.343 0 .662-.095.931-.26-.137.389-.39.804-.81 1.22a.405.405 0 0 0 .011.59c.173.16.447.155.614-.01 1.334-1.329 1.37-2.758.941-3.706a2.461 2.461 0 0 0-.227-.4zM11 7.073c-.136.389-.39.804-.81 1.22a.405.405 0 0 0 .012.59c.172.16.446.155.613-.01 1.334-1.329 1.37-2.758.942-3.706a2.466 2.466 0 0 0-.228-.4 1.686 1.686 0 0 0-.227-.273 1.466 1.466 0 0 0-.469-.324l-.008-.004A1.785 1.785 0 0 0 10.07 4c-.957 0-1.734.746-1.734 1.667 0 .92.777 1.666 1.734 1.666.343 0 .662-.095.931-.26z"/>
</svg>
          </a>`
                  : ""
              }<a class="btn copix" title="${t$`${this.lang}Copy`}" @click=${() => {
                copix(content);
              }}></a><a class="btn trash ${
                !cc ? "r2" : ""
              }" title="${t$`${this.lang}Delete`}" data-i="${i}" @click=${this._delete}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
</svg></a>`
              : ""
          }</div>`;
        })
        : ""
    }${
      _waiting && _waiting.length > 0
        ? html`<div class="assistant">${
          _waiting[0] === dots
            ? html`<div id="dots">${_waiting}</div>`
            : html`<p>${_waiting}</p>`
        }</div>`
        : ""
    }<div class="next ${imax > 0 ? "has" : ""}">
      <input autofocus id="mysay" class="rl" @keypress=${this._enter} placeholder="${
      imax > 0 ? t$`${this.lang}${max - body.length}Session` : ""
    }">
      <a class="btn rr" ?disabled=${
      _waiting && _waiting.length > 0 ? true : false
    } role="button" @click=${this.next}>
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-return-left" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5z"/>
</svg>
      </a>
    </div>`;
  }

  static styles = css`
  :host {
    display: block;
    font-size: 1rem;
    padding-top: 2rem;
    padding-bottom: 1rem;
    max-width: 100%;
    border-top: thin dashed #ddd;
    position: relative;
  }
  :host::before {
    content: '❝';
    position: absolute;
    top: -.5rem;
    left: 0;
    background: #fff;
    zoom: .7;
    padding-right: 1rem;
    color: #ccc;
  }
  :host(.fin) .next {
    display: none;
  }
  #dots {clear:both; text-align:center; color:#d63;-webkit-animation: loading 1s 32; animation: loading 1s 32}
  #dots a {color:inherit;text-decoration:none}
  @-webkit-keyframes loading { 50% {color:#333} }
  @keyframes loading { 50% {color:#333} }
  
  .user,
  .assistant,
  .next {
    background: #fff;
    padding: 1rem;
    border-radius: 0.375rem;
    position: relative;
  }
  
  .user {
    box-shadow: 0 -.125rem 1rem rgba(159, 176, 205, .35);
    margin-bottom: .5rem;
    text-align: right;
    padding-right: 3.2rem;
  }
  .user::after {
    width: 20px;
    height: 20px;
    content: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22%2376a0df%22%20class%3D%22bi%20bi-chat-right-text-fill%22%20viewBox%3D%220%200%2016%2016%22%3E%0A%20%20%3Cpath%20d%3D%22M16%202a2%202%200%200%200-2-2H2a2%202%200%200%200-2%202v8a2%202%200%200%200%202%202h9.586a1%201%200%200%201%20.707.293l2.853%202.853a.5.5%200%200%200%20.854-.353V2zM3.5%203h9a.5.5%200%200%201%200%201h-9a.5.5%200%200%201%200-1zm0%202.5h9a.5.5%200%200%201%200%201h-9a.5.5%200%200%201%200-1zm0%202.5h5a.5.5%200%200%201%200%201h-5a.5.5%200%200%201%200-1z%22/%3E%0A%3C/svg%3E);
    position: absolute;
    right: 1rem;
    top: 1.2em;
    z-index: 0;
  }
  .assistant {
    box-shadow: 0 .25rem .5rem rgba(0,0,0,.15);
    background: #d1ecff;
    margin-bottom: 1.25rem;
    padding-bottom: 2rem;
  }
  .err {
    color: #a00;
    text-align: center;
    padding: auto 1rem;
  }
  .user > p,
  .assistant > p {
    text-indent: 2rem;
    margin: 0;
    padding: 0;
    unicode-bidi: embed;
    white-space: pre-wrap;       /* css-3 */
   white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
   white-space: -pre-wrap;      /* Opera 4-6 */
   white-space: -o-pre-wrap;    /* Opera 7 */
   word-wrap: break-word;       /* Internet Explorer 5.5+ */
    max-width: 100%;
  }
  .user > p {
    text-index: 0rem;
  }
  
  .assistant::before {
    width: 20px;
    height: 20px;
    content: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22%23f69%22%20viewBox%3D%220%200%2032%2032%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22m29.7%2013.1c.4-1.1.5-2.2.4-3.3s-.5-2.2-1-3.2c-.9-1.5-2.2-2.7-3.7-3.4-1.6-.7-3.3-.9-5-.5-.8-.8-1.7-1.5-2.7-2s-2.2-.7-3.3-.7c-1.7%200-3.4.5-4.8%201.5s-2.4%202.4-2.9%204c-1.2.3-2.2.8-3.2%201.4-.9.7-1.6%201.6-2.2%202.5-.9%201.5-1.2%203.2-1%204.9s.9%203.3%202%204.6c-.4%201.1-.5%202.2-.4%203.3s.5%202.2%201%203.2c.9%201.5%202.2%202.7%203.7%203.4%201.6.7%203.3.9%205%20.5.8.8%201.7%201.5%202.7%202s2.2.7%203.3.7c1.7%200%203.4-.5%204.8-1.5s2.4-2.4%202.9-4c1.1-.2%202.2-.7%203.1-1.4s1.7-1.5%202.2-2.5c.9-1.5%201.2-3.2%201-4.9s-.8-3.3-1.9-4.6zm-12%2016.8c-1.6%200-2.8-.5-3.9-1.4%200%200%20.1-.1.2-.1l6.4-3.7c.2-.1.3-.2.4-.4s.1-.3.1-.5v-9l2.7%201.6v7.4c.1%203.5-2.7%206.1-5.9%206.1zm-12.9-5.5c-.7-1.2-1-2.6-.7-4%200%200%20.1.1.2.1l6.4%203.7c.2.1.3.1.5.1s.4%200%20.5-.1l7.8-4.5v3.1l-6.5%203.8c-1.4.8-3%201-4.5.6-1.6-.4-2.9-1.4-3.7-2.8zm-1.7-13.9c.7-1.2%201.8-2.1%203.1-2.6v.2%207.4c0%20.2%200%20.4.1.5.1.2.2.3.4.4l7.8%204.5-2.7%201.6-6.4-3.7c-1.4-.8-2.4-2.1-2.8-3.6s-.3-3.3.5-4.7zm22.1%205.1-7.8-4.5%202.7-1.6%206.4%203.7c1%20.6%201.8%201.4%202.3%202.4s.8%202.1.7%203.3c-.1%201.1-.5%202.2-1.2%203.1s-1.6%201.6-2.7%202v-7.6c0-.2%200-.4-.1-.5%200%200-.1-.2-.3-.3zm2.7-4s-.1-.1-.2-.1l-6.4-3.7c-.2-.1-.3-.1-.5-.1s-.4%200-.5.1l-7.8%204.5v-3.1l6.5-3.8c1-.6%202.1-.8%203.3-.8%201.1%200%202.2.4%203.2%201.1.9.7%201.7%201.6%202.1%202.6s.5%202.2.3%203.3zm-16.8%205.6-2.7-1.6v-7.5c0-1.1.3-2.3.9-3.2.6-1%201.5-1.7%202.5-2.2s2.2-.7%203.3-.5c1.1.1%202.2.6%203.1%201.3%200%200-.1.1-.2.1l-6.4%203.7c-.2.1-.3.2-.4.4s-.1.3-.1.5zm1.4-3.2%203.5-2%203.5%202v4l-3.5%202-3.5-2z%22/%3E%0A%20%20%3C/svg%3E);
    position: absolute;
    left: 1rem;
    top: 1rem;
    z-index: 0;
  }
  .assistant a.btn {
    display: none;
  }
  .assistant:hover a.btn {
    display: inline-flex;
  }
  .err a.btn {
    display: none!important;
  }
  a * {
    pointer-events: none;
  }
  .next {
    padding: 0;
    display: flex;
    box-shadow: 0 .5rem .5rem rgba(0,0,0,.15);
  }
  .next input {
    flex: 1;
    padding: .5rem 1rem;
    font-size: 1.4rem;
    line-height: 1.2em;
    outline: none;
    text-align: center;
    min-width: 75%;
  }
  .copix {
    padding: 1rem!important;
    width: 32px;
    height: 32px;
    position: absolute!important;
    right: 1rem;
    bottom: 1rem;
    z-index: 1;
    opacity: .8;
  }
  .trash {
    padding: .5rem!important;
    color: red;
    opacity: .8;
    position: absolute!important;
    right: 9rem;
    bottom: 1rem;
    z-index: 1;
  }
  .trash.r2 {
    right: 5.5rem;
  }
  .copix::before {
    width: 16px;
    height: 16px;
    content: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%23933%22%20class%3D%22bi%20bi-clipboard-pulse%22%20viewBox%3D%220%200%2016%2016%22%3E%0A%20%20%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M10%201.5a.5.5%200%200%200-.5-.5h-3a.5.5%200%200%200-.5.5v1a.5.5%200%200%200%20.5.5h3a.5.5%200%200%200%20.5-.5v-1Zm-5%200A1.5%201.5%200%200%201%206.5%200h3A1.5%201.5%200%200%201%2011%201.5v1A1.5%201.5%200%200%201%209.5%204h-3A1.5%201.5%200%200%201%205%202.5v-1Zm-2%200h1v1H3a1%201%200%200%200-1%201V14a1%201%200%200%200%201%201h10a1%201%200%200%200%201-1V3.5a1%201%200%200%200-1-1h-1v-1h1a2%202%200%200%201%202%202V14a2%202%200%200%201-2%202H3a2%202%200%200%201-2-2V3.5a2%202%200%200%201%202-2Zm6.979%203.856a.5.5%200%200%200-.968.04L7.92%2010.49l-.94-3.135a.5.5%200%200%200-.895-.133L4.232%2010H3.5a.5.5%200%200%200%200%201h1a.5.5%200%200%200%20.416-.223l1.41-2.115%201.195%203.982a.5.5%200%200%200%20.968-.04L9.58%207.51l.94%203.135A.5.5%200%200%200%2011%2011h1.5a.5.5%200%200%200%200-1h-1.128L9.979%205.356Z%22/%3E%0A%3C/svg%3E);
  }
  
  .continue {
    width: 32px;
    height: 32px;
    position: absolute!important;
    right: 4.5rem;
    bottom: 1rem;
    z-index: 1;
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
  
  .btn:hover { background: #F6F9FE; color: #174ea6;}
  .btn:active { box-shadow: 0 4px 4px 0 var(--a), 0 8px 12px 6px var(--b); outline: none;}
  .btn:focus { outline: none; border: 2px solid #4285f4;}
  .btn:not(:disabled) { box-shadow: var(--a) 0 1px 3px 0, var(--b) 0 4px 8px 3px;}
  .btn:not(:disabled):hover { box-shadow: var(--a) 0 2px 3px 0, var(--b) 0 6px 10px 4px;}
  .btn:not(:disabled):focus { box-shadow: var(--a) 0 1px 3px 0, var(--b) 0 4px 8px 3px;}
  .btn:not(:disabled):active { box-shadow: var(--a) 0 4px 4px 0, var(--b) 0 8px 12px 6px;}
  .btn:disabled { box-shadow: var(--a) 0 1px 3px 0, var(--b) 0 4px 8px 3px;pointer-events:none;cursor:default}
  
  .next {
    max-width: 64rem;
    margin: 0 auto;
  }
  .next .btn { box-shadow: none; background: #008a0e; color: #fff;}
  .next .btn[disabled] {background: #ccc!important;pointer-events:none}
  .rl { border: thin solid #008a0e;border-radius: .25rem 0 0 .25rem; border-right-width: 0}
  .r0 { border: thin solid #008a0e; border-radius: 0; border-width: thin 0; background: #666!important}
  .rr { border: thin solid #008a0e;border-radius: 0 .25rem .25rem 0; border-left-width: 0}
  .has { margin-bottom: 1.5rem; }
  .has .rl, .has .r0, .has .rr { border-color: #5e82b5;}
  .has .btn { background: #5e82b5;}
  `;
}
customElements.define("de-chat", DeChat);
