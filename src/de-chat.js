// !bundle=off
import {
  css,
  html,
  LitElement,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";

import { t$ } from "./t$.js";
import { aichat, copix, po$t, q$ } from "./de.js";

const dots = "❞";
t$.got({
  ApiErr: { zh_CN: "须正确设置api", en_US: "proper api required" },
  Continue: { zh_CN: "继续" },
  Remove: { zh_CN: "删除此记录？", en_US: "Remove this log?" },
  Regen: {
    zh_CN: "重新提问？当前答案将被清除",
    en_US: "Retry? Current one will be cleared",
  },
  Copy: { zh_CN: "拷贝" },
  Delete: { zh_CN: "删除" },
  Session: {
    zh_CN: "续聊模式，限{{0}}字符",
    en_US: "session continue, limits to {{0}} character(s)",
  },
});

// TODO - plugins for 1) input pane, render, api, 2) output render

// DeChat Component
export class DeChat extends LitElement {
  static properties = {
    cells: { type: Array },
    api: { type: Object },
    lang: { type: String },
    for: { type: String },
    _tid: { type: Object },
    key: { type: Number },
    _current: { type: Number },
    _asking: { type: String },
    _waiting: { type: Array },
    _stage: { type: HTMLElement },
    _ime: { type: String },
    _plugins: { type: Array },
  };

  constructor() {
    super();
    this.lang = "zh_CN";
    this._current = -1;
  }

  firstUpdated() {
    const _stage = this.for && q$(this.for) ||
      this.renderRoot.host.parentNode;
    this._stage = _stage;
    this.api = (_stage.host || _stage).api || globalThis.deAPI || aichat;
  }

  ask(something, i) {
    const { cells = [], api = aichat } = this;
    const speech = i === -1;
    const n = !isNaN(i) && i < cells.length - 1 ? i : -1;
    this._current = n;
    this._asking = something;
    if (n > -1) {
      cells[n].content = something;
      cells[n + 1] = { role: "assistant", style: "busying", content: dots };
    }

    const asking = { role: "user", content: something };

    const feed = (answer, coderr) => {
      this._cancel = undefined;
      if (n > -1) {
        cells[n + 1] = answer;
        if (coderr < 0) {
          cells[n + 1].style = "err";
        } else {
          delete cells[n + 1].style;
        }
      } else {
        cells.push(asking, answer);
      }
      this._asking = "";
      this._waiting = [];
      this.cells = cells.slice(0);
      if (coderr == -1) return;
      this.notify(`de-${coderr < -1 ? "new" : "changed"}`);
      if (speech && (!coderr || coderr > -1)) {
        this.speak(answer.content);
      }
    }; // update

    const { url, streaming, headers, got, max } = api;
    if (!url || !got) {
      feed({ role: "assistant", content: t$`${this.lang}ApiErr` }, -1);
      return;
    }
    this._waiting = [dots];

    const data = cells.slice(0, n > -1 ? n + 1 : undefined)
      .concat(n === -1 ? [asking] : []).map((cell) => {
        if (cell.style) delete cell.style;
        if (/err/.test(cell.role)) return undefined;
        return cell;
      }).filter((cell) => !!cell);

    let list = data;
    if (max) {
      let i = 0;
      while (JSON.stringify(list).length > max) {
        i += 2;
        if (list.length == 2) break;
        list = list.slice(i);
      }
    }

    po$t(list, (c, streaming, cancel) => {
      this._cancel = cancel;
      const { fin = !streaming, err, cell } = got(c, streaming);
      const failed = typeof fin == "number" && fin < 0;
      const role = `assistant${err || failed ? " err" : ""}`;
      if (err) {
        this.renderRoot.host.classList.add("fin");
      }
      if (!streaming || err) {
        feed({
          role,
          ...cell,
          ...(err ? { content: html`[ERR] ${err}` } : {}),
        }, err ? -2 : 0);
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
        feed(
          { role, ...cell, content: _waiting.join("") },
          err || failed ? -3 : 0,
        );
        return;
      }
      this._waiting = _waiting.slice(0);
      if (n > -1) {
        cells[n + 1].content = this._waiting;
        this.requestUpdate();
      }
    }, { api: url, streaming, headers }) || {};
  }

  next() {
    if (this._waiting && this._waiting.length > 0) return;
    const { renderRoot } = this;
    const mysay = q$("#mysay", renderRoot);
    if (/^\s*$/.test(mysay.value)) {
      this._focus();
      return;
    }
    this.ask(mysay.value.trim());
    this.input("");
  }

  input(c) {
    const { renderRoot, _tid } = this;
    if (_tid) clearTimeout(_tid);
    const mysay = q$("#mysay", renderRoot);
    if (c || typeof c === "string") mysay.value = c.trim();
    this._tid = setTimeout(() => {
      if (renderRoot.host.classList.contains("fin")) return;
      this._focus();
    }, 300);
  }

  _focus() {
    q$("#mysay", this.renderRoot).focus();
  }

  active() {
    return this.cells?.length > 0 || this._waiting?.length > 0;
  }

  notify(name, detail) {
    if (name == "de-changed" && !detail) {
      detail = this.key;
    }
    (this._stage.host || this._stage).dispatchEvent(
      new CustomEvent(name, { detail }),
    );
  }

  focus() {
    const { renderRoot } = this;
    if (this._stage) {
      this.notify("de-focus", renderRoot.host);
    }
    const cl = renderRoot.host.classList;
    if (cl.contains("fin")) {
      cl.remove("fin");
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
    const n = parseInt(i, 10);
    if (this._current > -1) {
      if (n < this._current) {
        this._current -= 1;
      }
    }
    this.cells.splice(n - 1, 2);
    if (this.cells.length > 0) {
      this.requestUpdate();
    } else {
      if (this._cancel) {
        this._cancel();
      }
      const p = this.renderRoot.host.parentNode;
      p.removeChild(this.renderRoot.host); // may left something else
    }
    this.notify("de-changed");
  }

  _edit(evt) {
    const t = evt.target;
    const { i } = t.dataset;
    const n = parseInt(i, 10);
    const cell = this.cells[n];
    if (!cell) return;
    q$("#mysay", this.renderRoot).value = cell.content;
    this.focus();
  }

  _stop(evt) {
    this._cancel();
  }

  _regen(evt) {
    const t = evt.target;
    const failed = t.parentElement.classList.contains("err");
    if (!failed && !confirm(t$`${this.lang}Regen`)) {
      return;
    }

    const { i } = t.dataset;
    const n = parseInt(i, 10);
    const cell = this.cells[n - 1];
    if (!cell) return;
    this.ask(cell.content, n - 1);
  }

  speak(text) {
    document.dispatchEvent(new CustomEvent("speak", { detail: text }));
  }

  speech(starting = true) {
    const mysay = q$("#mysay", this.renderRoot);
    if (!/^\s*$/.test(mysay.value)) {
      return;
    }
    if (window.speechListen) {
      speechListen(starting);
    }
  }

  plugin(addon) {
    const x = !(addon instanceof Array) ? [addon] : addon;
    const addons = [...(this._plugins || [])];
    let i = 0;
    x.forEach((a) => {
      if (addons.filter((t) => t.id == a.id).length > 0) {
        return;
      }
      addons.push(a);
      i += 1;
    });
    if (i > 0) {
      this._plugins = addons;
    }
  }

  _view(content, role, _plugins) {
    let body = content;
    if (_plugins && _plugins.length > 0) {
      _plugins.forEach((addon) => {
        if (addon.has(content)) {
          body =
            ((role == "user" && addon.brief) || addon.render)?.(body, html) ||
            body;
        }
      });
    }
    return body;
  }

  _pane({ placeholder, size, disabled = false, ime }, _plugins) {
    const custom =
      (ime
        ? (_plugins || []).filter((addon) =>
          addon.ime == ime || addon.id == ime
        )
        : [])[0];
    if (custom) {
      return custom({ placeholder, size, disabled, ime }, html);
    }
    return html`<div class="next ${size > 0 ? "has" : ""}">
    <input  x-webkit-speech autofocus type="search" id="mysay" class="rl" @keypress=${this._enter} placeholder="${placeholder}">
    <a class="btn rr" ?disabled=${
      disabled || false
    } role="button" @click=${this.next} @mousedown=${(evt) => {
      this.speech();
    }} @mouseup=${(evt) => {
      this.speech(false);
    }}>
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-return-left" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5z"/>
</svg>
    </a>
  </div>`;
  }

  render() {
    const { max = 4096 } = this.api || {};
    const {
      cells = [],
      _current,
      _asking,
      _waiting,
      _cancel,
      _view,
      _ime,
    } = this;
    const imax = cells.length;
    const body = JSON.stringify(cells);
    const _plugins = [
      ...(this._stage?.host?.plugins || []),
      ...(this._plugins || []),
    ];
    return html`${
      imax > 0
        ? cells.map((cell, i) => {
          const { role, content, style } = cell;
          const cc = i == imax - 1 && body.length < max &&
            !role.includes("err");
          return html`<div class="${role} ${style || ""}">${
            content === dots
              ? html`<div id="dots">${dots}</div>`
              : html`<p>${_view(content, role, _plugins)}</p>`
          }${
            role.includes("assistant")
              ? html`${
                _cancel
                  ? html`<a class="btn cancel" @click=${this._stop}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="red" class="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
</svg></a>`
                  : (i !== _current
                    ? html`<a class="btn regen" data-i="${i}" @click=${this._regen}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="red" class="bi bi-trash3" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
  <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
</svg></a>`
                    : "")
              }
              <a class="btn trash ${
                !cc ? "r2" : ""
              }" title="${t$`${this.lang}Delete`}" data-i="${i}" @click=${this._delete}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
</svg></a>${
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
              }}></a><a class="btn speak" @click=${() => {
                this.speak(content);
              }}></a>`
              : (
                role.includes("user")
                  ? html`<a class="btn edit" data-i="${i}" @click=${this._edit}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
</svg></a>`
                  : ""
              )
          }</div>`;
        })
        : ""
    }${
      _current === -1 && _asking
        ? html`<div class="user"><p>${_asking}</p></div>`
        : ""
    }${
      _current === -1 && _waiting && _waiting.length > 0
        ? html`<div class="assistant">${
          _waiting[0] === dots
            ? html`<div id="dots">${_waiting}</div>`
            : html`<p>${_view(_waiting, 'assistant', _plugins)}</p>`
        }</div>`
        : ""
    }${
      this._pane({
        placeholder: imax > 0
          ? t$`${this.lang}${max - body.length}Session`
          : "",
        size: imax,
        disabled: _waiting && _waiting.length > 0,
        ime: _ime,
      }, _plugins)
    }`;
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

 .next::after {
    content: var(--speaking-ico, '');
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    opacity: .5;
    animation: speaking 1s;
  }
  @keyframes speaking { 50% {opacity: .2} }
  
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
    display: flex!important;
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
    text-indent: 0;
    text-align: left;
    margin-left: auto;
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
  .user a.btn,
  .assistant a.btn {
    display: none;
  }
  .user:hover a.btn,
  .assistant:hover a.btn {
    display: inline-flex;
  }
  .busying:hover a.stop {
    display: inline-flex!important;
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
  .speak,
  .trash {
    padding: .5rem!important;
    color: red;
    opacity: .8;
    position: absolute!important;
    right: 9rem;
    bottom: 1rem;
    z-index: 1;
  }
  .speak {
    right: -1.5rem;
  }

  .trash.r2 {
    right: 5.5rem;
  }
  .copix::before {
    width: 16px;
    height: 16px;
    content: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%23933%22%20class%3D%22bi%20bi-clipboard-pulse%22%20viewBox%3D%220%200%2016%2016%22%3E%0A%20%20%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M10%201.5a.5.5%200%200%200-.5-.5h-3a.5.5%200%200%200-.5.5v1a.5.5%200%200%200%20.5.5h3a.5.5%200%200%200%20.5-.5v-1Zm-5%200A1.5%201.5%200%200%201%206.5%200h3A1.5%201.5%200%200%201%2011%201.5v1A1.5%201.5%200%200%201%209.5%204h-3A1.5%201.5%200%200%201%205%202.5v-1Zm-2%200h1v1H3a1%201%200%200%200-1%201V14a1%201%200%200%200%201%201h10a1%201%200%200%200%201-1V3.5a1%201%200%200%200-1-1h-1v-1h1a2%202%200%200%201%202%202V14a2%202%200%200%201-2%202H3a2%202%200%200%201-2-2V3.5a2%202%200%200%201%202-2Zm6.979%203.856a.5.5%200%200%200-.968.04L7.92%2010.49l-.94-3.135a.5.5%200%200%200-.895-.133L4.232%2010H3.5a.5.5%200%200%200%200%201h1a.5.5%200%200%200%20.416-.223l1.41-2.115%201.195%203.982a.5.5%200%200%200%20.968-.04L9.58%207.51l.94%203.135A.5.5%200%200%200%2011%2011h1.5a.5.5%200%200%200%200-1h-1.128L9.979%205.356Z%22/%3E%0A%3C/svg%3E);
  }

  .speak::before {
    width: 16px;
    height: 16px;
    content: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22currentColor%22%20class%3D%22bi%20bi-megaphone-fill%22%20viewBox%3D%220%200%2016%2016%22%3E%0A%20%20%3Cpath%20d%3D%22M13%202.5a1.5%201.5%200%200%201%203%200v11a1.5%201.5%200%200%201-3%200v-11zm-1%20.724c-2.067.95-4.539%201.481-7%201.656v6.237a25.222%2025.222%200%200%201%201.088.085c2.053.204%204.038.668%205.912%201.56V3.224zm-8%207.841V4.934c-.68.027-1.399.043-2.008.053A2.02%202.02%200%200%200%200%207v2c0%201.106.896%201.996%201.994%202.009a68.14%2068.14%200%200%201%20.496.008%2064%2064%200%200%201%201.51.048zm1.39%201.081c.285.021.569.047.85.078l.253%201.69a1%201%200%200%201-.983%201.187h-.548a1%201%200%200%201-.916-.599l-1.314-2.48a65.81%2065.81%200%200%201%201.692.064c.327.017.65.037.966.06z%22/%3E%0A%3C/svg%3E);
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
  
  a.regen,
  a.cancel,
  a.edit {
    padding: .25rem!important;
    opacity: .8;
    position: absolute!important;
    left: 1rem;
    bottom: .5rem;
    z-index: 1;
    box-shadow: none!important;
    transition: none;
  } 
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
