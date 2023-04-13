import { serve } from "https://deno.land/std@0.183.0/http/server.ts";

serve((_req) => {
  return new Response("Hello DeChat!", {
    headers: { "content-type": "text/plain" },
  });
});
