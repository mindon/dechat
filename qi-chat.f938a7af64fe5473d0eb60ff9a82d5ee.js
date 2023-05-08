var tt=Object.defineProperty;var et=(r,t,e)=>t in r?tt(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var C=(r,t,e)=>(et(r,typeof t!="symbol"?t+"":t,e),e);import{css as ot,html as lt,LitElement as ct}from"https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";var b=globalThis||{};function v(r,t,e){t instanceof Function&&(e=t,t=document);let i=(t||document).querySelector(r);return e&&i&&i.addEventListener("click",e),i}b.q$=v;function R(r,t,e){t instanceof Function&&(e=t,t=document);let i=(t||document).querySelectorAll(r);return e&&[].slice.apply(i).forEach(e),i}b.q$$=R;var k=b.document||{addEventListener:()=>{}};function D(r,t){let e,i=r,s=!i.tagName;s?(e=k.createElement("textarea"),e.value=i,e.readOnly=!0,e.style.top="0",e.style.left="0",e.style.height="1px",e.style.width="1px",e.style.position="fixed",k.body.appendChild(e)):(e=i,i=e.value),e.setSelectionRange(0,Number.MAX_VALUE),e.select(),setTimeout(()=>{e.focus();try{let a=k.execCommand("copy");t&&t(a)}catch(a){t&&t(!1,a)}s&&k.body.removeChild(e)},50)}function U(r,t){try{navigator.permissions.query({name:"clipboard-write"}).then(e=>{if(e.state!=="granted"&&e.state!=="prompt"){D(r,t);return}let i=navigator.clipboard;if(!i){D(r,t);return}i.writeText(r.value||r||"").then(s=>{t&&t(s)},s=>{D(r,t)})}).catch(e=>{D(r,t)})}catch{D(r,t)}}b.copix=U;async function J(r,t,{api:e,headers:i,streaming:s}){let a=JSON.stringify(r),n=b.AbortController?new AbortController:{},l=n.signal,o=await fetch(e,{method:"POST",signal:l,mode:"cors",headers:[["Content-Type","application/json"]].concat((i instanceof Function?i():i)||[]),body:a});if(o.status>=400){let d=await o.text();if(d.startsWith("{"))try{let m=JSON.parse(d),{error:p={},err:u=""}=m;u?d=u:typeof p=="string"?d=p:p.message&&(d=p.message)}catch{}t({err:`${o.status}: ${d||o.statusText}: `});return}if(!s){t(await o.json());return}let h=o.body.pipeThrough(new TextDecoderStream).getReader(),g=!1,w=()=>{n.abort?.(),g=!0,t(['{"error":{"message":"~canceled"}}'],s)};for(;!g;){let{value:d,done:m}=await h.read();if(m)break;t(d.split("data: "),s,w)}}b.po$t=J;function L(r,t){if(t===void 0)return localStorage.getItem(r);if(t===!1){localStorage.removeItem(r);return}localStorage.setItem(r,t)}b.data$=L;function z(r,t,e){if(!b.indexedDB)return;let{mode:i="readonly"}=e,s=indexedDB.open(r);s.onsuccess=a=>{let n=a.target.result;if(!n.objectStoreNames.contains(t)){e(null,`no ${t} data`);return}e(n.transaction([t],i).objectStore(t))},s.onupgradeneeded=a=>{let n=a.target.result,l;n.objectStoreNames.contains(t)?l=n.transaction([t],i).objectStore(t):l=n.createObjectStore(t,e.options||{autoIncrement:!0}),e(l)},s.onblocked=a=>{e(null,a.target.error||"blocked")},s.onerror=a=>{e(null,a.target.error||"error")}}z.do=async(r,t)=>{let{mode:e="readwrite",name:i="chat",id:s="de"}=t||{};return new Promise((a,n)=>{let l=async(o,c)=>{if(c||!o)return n(c||"invalid store");let h=r(o);return h.onsuccess=g=>{a(g.target.result)},h.onerror=g=>{n(g.target.error)},h};l.mode=e,z(s,i,l)})};z.get=async(r,t)=>{let{name:e="chat",id:i="de"}=t||{};return new Promise((s,a)=>{let n=(l,o)=>{if(o||!l)return a(o||"invalid store");let c=l.get(r);c.onerror=h=>{a(h.target.error)},c.onsuccess=h=>{s(h.target.result)}};n.mode="readonly",z(i,e,n)})};z.count=async r=>{let{cond:t,cb:e,name:i="chat",id:s="de"}=r||{},a=[];return new Promise((n,l)=>{let o=(c,h)=>{if(h||!c)return l(h||"invalid store");let g=c.count(t);g.onerror=w=>{l(w.target.error)},g.onsuccess=w=>{let d=w.target.result;e?e(c,{resolve:n,reject:l,count:d}):n(d)}};o.mode="readonly",z(s,i,o)})};z.query=async r=>{let{cond:t=null,start:e=0,n:i=3,name:s="chat",id:a="de"}=r||{},n=[],l=0;return z.count({cond:t,name:s,id:a,cb:(o,{resolve:c,reject:h,count:g})=>{l=g;let w=o.openCursor(t,"prev"),d=0;w.onsuccess=m=>{let p=m.target.result;if(p){if(d<e){d+=1,p.continue();return}if(n.push({key:p.key,value:p.value}),i>0&&n.length==i){c({result:n,total:l});return}p.continue()}else c({result:n,total:l})},w.onerror=m=>{h(m.target.error)}}})};b.db$=z;var _=new URL(`about:blank${b.location?.search||""}`).searchParams,O=_.has("vip")&&/^\w{1,16}$/.test(_.get("vip"))?_.get("vip"):"";O&&(v("html").dataset.vip=O);var it="[DONE]",M={url:"/chat?stream",streaming:!0,headers:()=>{let r=[],t="x-openai",e=L("ik");e&&e.length>8&&r.push([`${t}-key`,e]),O&&r.push([`${t}-vip`,O]),"vip,lang,speech".split(",").forEach(s=>{_.has(s)&&_.delete(s)});let i=_.toString();return i&&r.push([`${t}-args`,btoa(i)]),r},got:(r,t)=>{if(r&&r.err)return{err:r.err};if(!t){let{choices:s=[]}=r||{},{content:a}=s.length>0&&s[0]||{};return a?{cell:{content:a}}:{err:r.error&&r.error.message||"unknown error"}}let e=!1,i=r.map(s=>{if(!s)return"";if(!s.startsWith("{"))return e=s.trim()==it,e?"":s;let a=JSON.parse(s.trim()),{error:n={}}=a;return n.message?(e=-2,`[!ERR] ${n.message}`):a}).map(s=>s?typeof s=="string"?s:s.choices&&s.choices[0].delta.content||"":"").join("");return{fin:e,cell:{content:i}}}},Y="",$=b.speechSynthesis||{};b.addEventListener("beforeunload",()=>{$.cancel?.()});k.addEventListener("speak",r=>{let t=r.detail;if(Y!=t){$.speaking&&$.cancel?.(),$.speak(new SpeechSynthesisUtterance(t)),Y=t;return}$.speaking?$.paused?$.resume():$.pause():$.speak(new SpeechSynthesisUtterance(t))});var st=b.SpeechRecognition||b.webkitSpeechRecognition||Function,A=new st;A.continuous=!1;A.lang=_.has("lang")&&_.get("lang")||"zh-CN";A.interimResults=!1;A.maxAlternatives=1;A.onresult=r=>{let t=r.results[0][0].transcript;t&&b.dispatchEvent(new CustomEvent("speech-text",{detail:t}))};_.has("lang")&&_.remove("lang");var I;function Z(r=!0){if(I&&clearTimeout(I),r===!1){k.documentElement.classList.remove("speaking"),A.stop();return}A.abort(),I=setTimeout(()=>{A.start(),k.documentElement.classList.add("speaking")},100)}window.speechListen=Z;k.addEventListener("keydown",r=>{r.altKey&&Z()});k.addEventListener("keyup",r=>{Z(!1)});import{css as nt,html as f,LitElement as rt}from"https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";var T=/\{\{(\d+)\}\}/g,at=globalThis,H={};function y(r,...t){let e=H||{},i="";if(t.length<=1){i=r.join("");let o=e[i];return!o||t.length===0?i.replace(T,""):(o[t[0]]||i).replace(T,"")}let s=0;r.forEach((o,c)=>{o.length!==0&&(s=c)});let a=t.slice(1,s),n=r.slice(s);if(t.slice(s).forEach((o,c)=>{n.splice(c+1,0,o)}),i=n.join(""),t.length===0)return i.replace(T,"");let l=e[i];return!l||!l[t[0]]?i:l[t[0]].replace(T,(o,c)=>a[parseInt(c,10)]||"")}var G=!1;y.got=(r,t=!1)=>{let e=H||{};Object.keys(r).forEach(i=>{e[i]=e[i]?{...e[i],...r[i]}:{...r[i]}}),H=e,(t||G)&&localStorage.setItem("lib$",JSON.stringify(H))};if(new URL(import.meta.url).searchParams.has("global")){G=!0;let r=localStorage.getItem("lib$");if(r)try{H=JSON.parse(r)}catch{}}at.t$=y;var N="\u275E";y.got({ApiErr:{zh_CN:"\u987B\u6B63\u786E\u8BBE\u7F6Eapi",en_US:"proper api required"},Continue:{zh_CN:"\u7EE7\u7EED"},Remove:{zh_CN:"\u5220\u9664\u6B64\u8BB0\u5F55\uFF1F",en_US:"Remove this log?"},Regen:{zh_CN:"\u91CD\u65B0\u63D0\u95EE\uFF1F\u5F53\u524D\u7B54\u6848\u5C06\u88AB\u6E05\u9664",en_US:"Retry? Current one will be cleared"},Copy:{zh_CN:"\u62F7\u8D1D"},Delete:{zh_CN:"\u5220\u9664"},Session:{zh_CN:"\u7EED\u804A\u6A21\u5F0F\uFF0C\u9650{{0}}\u5B57\u7B26",en_US:"session continue, limits to {{0}} character(s)"}});var V=class extends rt{constructor(){super(),this.lang="zh_CN",this._current=-1}firstUpdated(){let t=this.for&&v(this.for)||this.renderRoot.host.parentNode;this._stage=t,this.api=(t.host||t).api||globalThis.deAPI||M}ask(t,e){let{cells:i=[],api:s=M}=this,a=e===-1,n=!isNaN(e)&&e<i.length-1?e:-1;this._current=n,this._asking=t,n>-1&&(i[n].content=t,i[n+1]={role:"assistant",style:"busying",content:N});let l={role:"user",content:t},o=(u,x)=>{this._cancel=void 0,n>-1?(i[n+1]=u,x<0?i[n+1].style="err":delete i[n+1].style):i.push(l,u),this._asking="",this._waiting=[],this.cells=i.slice(0),x!=-1&&(this.notify(`de-${x<-1?"new":"changed"}`),a&&(!x||x>-1)&&this.speak(u.content))},{url:c,streaming:h,headers:g,got:w,max:d}=s;if(!c||!w){o({role:"assistant",content:y`${this.lang}ApiErr`},-1);return}this._waiting=[N];let p=i.slice(0,n>-1?n+1:void 0).concat(n===-1?[l]:[]).map(u=>{if(u.style&&delete u.style,!/err/.test(u.role))return u}).filter(u=>!!u);if(d){let u=0;for(;JSON.stringify(p).length>d&&(u+=2,p.length!=2);)p=p.slice(u)}J(p,(u,x,Q)=>{this._cancel=Q;let{fin:j=!x,err:S,cell:B}=w(u,x),K=typeof j=="number"&&j<0,W=`assistant${S||K?" err":""}`;if(S&&this.renderRoot.host.classList.add("fin"),!x||S){o({role:W,...B,...S?{content:f`[ERR] ${S}`}:{}},S?-2:0);return}let{_waiting:E}=this;E||(E=[]);let X=B&&B.content;if(E.length==0||E[0]==N?E=[X]:E.push(X),j!==!1){o({role:W,...B,content:E.join("")},S||K?-3:0);return}this._waiting=E.slice(0),n>-1&&(i[n+1].content=this._waiting,this.requestUpdate())},{api:c,streaming:h,headers:g})}next(){if(this._waiting&&this._waiting.length>0)return;let{renderRoot:t}=this,e=v("#mysay",t);if(/^\s*$/.test(e.value)){this._focus();return}this.ask(e.value.trim()),this.input("")}input(t){let{renderRoot:e,_tid:i}=this;i&&clearTimeout(i);let s=v("#mysay",e);(t||typeof t=="string")&&(s.value=t.trim()),this._tid=setTimeout(()=>{e.host.classList.contains("fin")||this._focus()},300)}_focus(){v("#mysay",this.renderRoot).focus()}active(){return this.cells?.length>0||this._waiting?.length>0}notify(t,e){t=="de-changed"&&!e&&(e=this.key),(this._stage.host||this._stage).dispatchEvent(new CustomEvent(t,{detail:e}))}focus(){let{renderRoot:t}=this;this._stage&&this.notify("de-focus",t.host);let e=t.host.classList;e.contains("fin")&&e.remove("fin"),this.input()}_enter(t){t.key=="Enter"&&this.next()}_delete(t){let e=t.target;if(!e.parentElement.classList.contains("err")&&!confirm(y`${this.lang}Remove`))return;let{i:s}=e.dataset,a=parseInt(s,10);this._current>-1&&a<this._current&&(this._current-=1),this.cells.splice(a-1,2),this.cells.length>0?this.requestUpdate():(this._cancel&&this._cancel(),this.renderRoot.host.parentNode.removeChild(this.renderRoot.host)),this.notify("de-changed")}_edit(t){let e=t.target,{i}=e.dataset,s=parseInt(i,10),a=this.cells[s];!a||(v("#mysay",this.renderRoot).value=a.content,this.focus())}_stop(t){this._cancel()}_regen(t){let e=t.target;if(!e.parentElement.classList.contains("err")&&!confirm(y`${this.lang}Regen`))return;let{i:s}=e.dataset,a=parseInt(s,10),n=this.cells[a-1];!n||this.ask(n.content,a-1)}speak(t){document.dispatchEvent(new CustomEvent("speak",{detail:t}))}speech(t=!0){let e=v("#mysay",this.renderRoot);!/^\s*$/.test(e.value)||window.speechListen&&speechListen(t)}plugin(t){let e=t instanceof Array?t:[t],i=[...this._plugins||[]],s=0;e.forEach(a=>{i.filter(n=>n.id==a.id).length>0||(i.push(a),s+=1)}),s>0&&(this._plugins=i)}_view(t,e,i){let s=t;return i&&i.length>0&&i.forEach(a=>{a.has(t)&&(s=(e=="user"&&a.brief||a.render)?.(s,f)||s)}),s}_pane({placeholder:t,size:e,disabled:i=!1,ime:s},a){let n=(s?(a||[]).filter(l=>l.ime==s||l.id==s):[])[0];return n?n({placeholder:t,size:e,disabled:i,ime:s},f):f`<div class="next ${e>0?"has":""}">
    <input  x-webkit-speech autofocus type="search" id="mysay" class="rl" @keypress=${this._enter} placeholder="${t}">
    <a class="btn rr" ?disabled=${i||!1} role="button" @click=${this.next} @mousedown=${l=>{this.speech()}} @mouseup=${l=>{this.speech(!1)}}>
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-return-left" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5z"/>
</svg>
    </a>
  </div>`}render(){let{max:t=4096}=this.api||{},{cells:e=[],_current:i,_asking:s,_waiting:a,_cancel:n,_view:l,_ime:o}=this,c=e.length,h=JSON.stringify(e),g=[...this._stage?.host?.plugins||[],...this._plugins||[]];return f`${c>0?e.map((w,d)=>{let{role:m,content:p,style:u}=w,x=d==c-1&&h.length<t&&!m.includes("err");return f`<div class="${m} ${u||""}">${p===N?f`<div id="dots">${N}</div>`:f`<p>${l(p,m,g)}</p>`}${m.includes("assistant")?f`${n?f`<a class="btn cancel" @click=${this._stop}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="red" class="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
</svg></a>`:d!==i?f`<a class="btn regen" data-i="${d}" @click=${this._regen}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="red" class="bi bi-trash3" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
  <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
</svg></a>`:""}
              <a class="btn trash ${x?"":"r2"}" title="${y`${this.lang}Delete`}" data-i="${d}" @click=${this._delete}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
</svg></a>${x?f`<a class="btn continue" title="${y`${this.lang}Continue`} " @click=${()=>this.focus()}>
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-square-quote-fill" viewBox="0 0 16 16">
  <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a1 1 0 0 0-.8.4l-1.9 2.533a1 1 0 0 1-1.6 0L5.3 12.4a1 1 0 0 0-.8-.4H2a2 2 0 0 1-2-2V2zm7.194 2.766a1.688 1.688 0 0 0-.227-.272 1.467 1.467 0 0 0-.469-.324l-.008-.004A1.785 1.785 0 0 0 5.734 4C4.776 4 4 4.746 4 5.667c0 .92.776 1.666 1.734 1.666.343 0 .662-.095.931-.26-.137.389-.39.804-.81 1.22a.405.405 0 0 0 .011.59c.173.16.447.155.614-.01 1.334-1.329 1.37-2.758.941-3.706a2.461 2.461 0 0 0-.227-.4zM11 7.073c-.136.389-.39.804-.81 1.22a.405.405 0 0 0 .012.59c.172.16.446.155.613-.01 1.334-1.329 1.37-2.758.942-3.706a2.466 2.466 0 0 0-.228-.4 1.686 1.686 0 0 0-.227-.273 1.466 1.466 0 0 0-.469-.324l-.008-.004A1.785 1.785 0 0 0 10.07 4c-.957 0-1.734.746-1.734 1.667 0 .92.777 1.666 1.734 1.666.343 0 .662-.095.931-.26z"/>
</svg>
          </a>`:""}<a class="btn copix" title="${y`${this.lang}Copy`}" @click=${()=>{U(p)}}></a><a class="btn speak" @click=${()=>{this.speak(p)}}></a>`:m.includes("user")?f`<a class="btn edit" data-i="${d}" @click=${this._edit}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
</svg></a>`:""}</div>`}):""}${i===-1&&s?f`<div class="user"><p>${s}</p></div>`:""}${i===-1&&a&&a.length>0?f`<div class="assistant">${a[0]===N?f`<div id="dots">${a}</div>`:f`<p>${l(a,"assistant",g)}</p>`}</div>`:""}${this._pane({placeholder:c>0?y`${this.lang}${t-h.length}Session`:"",size:c,disabled:a&&a.length>0,ime:o},g)}`}};C(V,"properties",{cells:{type:Array},api:{type:Object},lang:{type:String},for:{type:String},_tid:{type:Object},key:{type:Number},_current:{type:Number},_asking:{type:String},_waiting:{type:Array},_stage:{type:HTMLElement},_ime:{type:String},_plugins:{type:Array}}),C(V,"styles",nt`
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
  `);customElements.define("de-chat",V);var F=document,P=F.createElement("a"),q=class extends ct{constructor(){super(),this._available=!0,this._ik=L("ik"),this._start=0,this._npp=3,this._total=0,this.api=M,this.plugins=[]}firstUpdated(){let t=this.renderRoot.host;t.addEventListener("de-changed",async e=>{let{detail:i}=e,s=[];R("de-chat",this.renderRoot,async a=>{a.cells?.length>0&&(!i||a.key==i)&&s.push([a.cells,a.key])}),(i===0||i)&&s.length==0?(db$.do(a=>a.delete(i)),this._total-=1,this._start-=1):this._total<this._start&&(this._total=this._start),s.length>0&&await db$.do(a=>Promise.all(s.filter(n=>!!n[1]).concat(s.filter(n=>!n[1])).map(([n,l])=>a.put(n,l)))),this._available=await db$.count()>0}),t.addEventListener("de-new",()=>{this.new()}),t.addEventListener("de-focus",e=>{R("de-chat",this.renderRoot,i=>{i!=e.detail&&i.classList.add("fin")})}),(async()=>{let e=L("ai"),i=!0;if(e){L("ai",!1);try{let s=JSON.parse(e);if(s&&s.length>0){i=!1;let{result:a,total:n}=await db$.query({n:0});await db$.do(async l=>{await l.clear();let o=s.concat(a.map(c=>c.value).reverse());return this.load(o.slice(-this._npp),o.length),Promise.all(o.map(c=>l.add(c)))})}}catch{}}else i&&this.more();this.new()})(),window.addEventListener("beforeunload",e=>{let i=!1;if(R("de-chat",this.renderRoot,s=>{i||s._waiting&&s._waiting.length>0&&(i=!0)}),i)return e.preventDefault(),e.returnValue="\u8FD8\u6709\u5BF9\u8BDD\u6CA1\u6709\u7ED3\u675F\uFF0C\u786E\u5B9A\u79BB\u5F00\uFF1F"},{capture:!0})}load(t,e){e!==void 0&&typeof e=="number"&&(this._total=e,this._start=0);let i;e instanceof HTMLElement&&(i=e,this._start+=this._npp);let s=[],a=t.filter(o=>o&&((o.key||o.key===0)&&(o.value||o.value.length>0)||o.length>0)).map((o,c)=>{let{key:h,value:g}=o;return!h&&h!==0&&!g?o:(s[c]=h,o.value)});if(!a||a.length==0)return!1;let n=v("#ia",this.renderRoot);i?n=i:(i=n.previousElementSibling,i&&i.tagName==="DE-CHAT"&&!i.active()&&(n=i));let{_total:l=0}=this;return a.forEach((o,c)=>{let h=F.createElement("de-chat");h.key=s[c]||l+c,h.className="fin",h.cells=o,this.renderRoot.insertBefore(h,n)}),this._available=!0,!0}new(){let t=v("#ia",this.renderRoot),e=t.previousElementSibling;if(!e||e.tagName!=="DE-CHAT"||e.active()){e&&e.classList.add("fin");let i=F.createElement("de-chat");this.renderRoot.insertBefore(i,t),e=i}e.focus()}_local(t){let e=prompt(`\u4F7F\u7528\u81EA\u5DF1\u7684OpenAI Key
  \u3010\u6CE8\u610F\u3011\u672C\u7AD9\u4E0D\u5B58\u50A8\uFF0C\u98CE\u9669\u81EA\u8D1F\u3002\uFF08\u5EFA\u8BAE\u5B58\u670D\u52A1\u5668\uFF09`);if(!!e){if(e==="CLEAR"){L("ik",!1),this._ik="";return}this._ik=btoa(e.trim()),L("ik",btoa(e.trim()))}}async clear(){await db$.count()===0||!confirm("\u786E\u8BA4\u8981\u6E05\u9664\u6240\u6709\u8BB0\u5F55\uFF1F")||(R("de-chat",this.renderRoot,t=>{!t.active()||t.parentNode.removeChild(t)}),db$.do(t=>t.clear()),this._available=!1,this.new())}_loadx=t=>{let e=t.target.files;if(!window.FileReader||!e||e.length==0)return;let i=new FileReader;i.onload=s=>{let a=s.target.result;try{let n=JSON.parse(a).filter(l=>l&&l.length>0);this.load(n)&&(n.length>0&&(this._start+=n.length),this.renderRoot.host.dispatchEvent(new CustomEvent("de-changed",{})))}catch(n){alert(n)}this.new()},i.readAsText(e[0])};more(t){(async()=>{try{let{result:e,total:i=0}=await db$.query({start:this._start+(t?this._npp:0),n:this._npp});e?this.load(e.reverse(),t?v("#mymore",this.renderRoot).nextElementSibling:i):this._available=!1}catch(e){console.log(e)}})()}async download(){let t;try{let{result:i,total:s}=await db$.query().catch(a=>console.error(a));s>0&&(t=JSON.stringify(i.map(a=>a.value)))}catch{}if(!t){alert("\u6CA1\u6709\u8BB0\u5F55\u6570\u636E");return}let e=new Date;P.download=`deqi-ai-chat_${[e.getFullYear(),`0${e.getMonth()+1}`.slice(-2),`0${e.getDate()}`.slice(-2)].join("")}.json`,P.href=`data:application/json;base64,${btoa(unescape(encodeURIComponent(t)))}`,P.click()}ask(t){let e=v("de-chat:not(.fin)",this.renderRoot);e&&e.ask(t,this.speech?-1:void 0)}render(){return lt`<div id="mymore" style="text-align: center;margin-bottom:.5rem"><a class="btn ${this._start<this._total-this._npp?"":"none"}" @click=${this.more}>${this._total-this._npp-this._start}<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
  </svg></a></div><div id="ia" style="text-align: center;position:relative;display: flex; align-items: center;">
    <a class="btn" id="myimport" @click=${()=>{v("#myfile",this.renderRoot).click()}} title="导入记录"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload" viewBox="0 0 16 16">
      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
    </svg></a>
    <a class="btn ${this._ik?"alarm":""}" id="mykey" @click=${this._local}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-key-fill" viewBox="0 0 16 16">
        <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
      </svg>
    </a>
    <a class="btn" id="newchat" @click=${this.new}>新话题 &nbsp; <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-square-text-fill" viewBox="0 0 16 16">
    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a1 1 0 0 0-.8.4l-1.9 2.533a1 1 0 0 1-1.6 0L5.3 12.4a1 1 0 0 0-.8-.4H2a2 2 0 0 1-2-2V2zm3.5 1a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9zm0 2.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9zm0 2.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5z"/>
  </svg></a>
  <a class="btn" id="myempty"  ?disabled=${!this._available} @click=${this.clear} title="清空记录"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg></a>
  <a class="btn" id="myexport" ?disabled=${!this._available} @click=${this.download} title="导出记录"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
  </svg></a>
</div><input id="myfile" type="file" accept=".json" style="display:none" @change=${this._loadx}>`}};C(q,"properties",{api:{type:Object},speech:{type:Boolean},_available:{type:Boolean},_ik:{type:String},_npp:{type:Number},_start:{type:Number},_total:{type:Number},plugins:{type:Array}}),C(q,"styles",ot`
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
`);customElements.define("qi-chat",q);export{q as QiChat};
