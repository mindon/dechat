import { serve } from "https://deno.land/std@0.183.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.183.0/http/file_server.ts";
import { OpenAI } from "https://raw.githubusercontent.com/mindon/openai/master/mod.ts";

const key = Deno.env.get("OPENAI_API_KEY");
const openAI = key ? new OpenAI(key) : null;
const openVIP: { [key: string]: OpenAI } = {};

const mimes: { [key: string]: string } = {
  html: "text/html; charset=utf-8",
  css: "text/css",
  js: "text/javascript",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  csv: "text/csv",
};

async function handler(request: Request): Promise<Response> {
  let { pathname } = new URL(request.url);
  if (pathname == "/chat") {
    if (request.method !== "POST") {
      return new Response(null, {
        status: 405,
        statusText: "Method Not Allowed",
      });
    }
    const messages = await request.json();
    const { headers } = request;
    const xraw = headers.get("x-openai-args");
    const xargs = (() => {
      try {
        const args: { [key: string]: string | number } = Object.fromEntries(
          new URL(`about:blank?${atob(xraw || "")}`).searchParams,
        );
        Object.keys(args).map((k) => {
          const s = args[k].toString();
          if (/[^\d.+-]/.test(s)) {
            return;
          }
          if (s.includes(".")) {
            args[k] = parseFloat(s);
          } else {
            args[k] = parseInt(s, 10);
          }
        });
        return args;
      } catch (_) {
        return {};
      }
    })();

    const xai = {
      messages,
      model: "gpt-3.5-turbo-16k-0613",
      temperature: 0.8,
      max_tokens: 256, // 2048
      top_p: 1,
      stream: false,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      ...xargs,
    };
    if (request.url.includes("?")) {
      const q = new URL(request.url).searchParams;
      if (q.has("stream")) {
        xai.stream = true;
      }
    }
    let vip = "";

    const ai = ((): OpenAI => {
      let key = "";
      vip = headers.get("x-openai-vip") || "";
      if (vip && /^\w{1,8}$/.test(vip)) {
        vip = vip.toUpperCase();
        key = Deno.env.get(`OPENAI_API_${vip}`);
        if (!key) {
          vip = "";
        }
      }
      let xkey = headers.get("x-openai-key");
      if (xkey) {
        key = xkey;
        try {
          key = atob(xkey);
        } catch (err) {
          key = xkey;
        }
      }
      if (!openAI && (!key || key && key.length <= 8)) {
        key = Deno.env.get("OPENAI_API_KEY");
      }
      if (key && key.length > 8) {
        return new OpenAI(key);
      }
      return openAI;
    })();

    if (!ai) {
      return new Response("OpenAI key required", { status: 401 });
    }
    const completion = await ai.createChatCompletion({
      ...xai,
    });
    if (xai.stream) {
      const headers = new Headers(completion.headers);
      headers.set("Content-Type", "application/octet-stream");
      headers.set("x-openai-vip", vip);

      return new Response(completion.body, {
        status: completion.status,
        statusText: completion.statusText,
        headers,
      });
    }
    return new Response(JSON.stringify(completion), {
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "x-openai-vip": vip,
      },
    });
  }
  if (pathname.endsWith("/")) {
    pathname = `${pathname}index.html`;
  }

  const resp = await serveFile(request, pathname.substring(1));
  const { status, statusText } = resp;
  const headers = [...resp.headers];
  let body = resp.body;
  let updated = false;
  if (resp.status >= 400) {
    body = "Hello, DeChat - from Mindon";
    updated = true;
  }
  if (pathname.startsWith("/lib/")) {
    headers.push(["Access-Control-Allow-Origin", "*"]);
    updated = true;
  }
  if (updated) {
    return new Response(body, {
      headers,
      status,
      statusText,
    });
  }
  return resp;
}

serve(handler, {
  port: 80,
});
