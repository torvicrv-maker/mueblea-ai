import { inspectImage3DDataUri, MAX_IMAGE_3D_DATA_URI_BYTES } from "../src/core/image3d";

const MESHY_API = "https://api.meshy.ai/openapi/v1/image-to-3d";
const DEFAULT_ALLOWED_ORIGINS = [
  "https://torvicrv-maker.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const recentTasksByClient = new Map<string, number[]>();
const TASK_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

interface MeshyTask {
  status?: unknown;
  progress?: unknown;
  model_urls?: { glb?: unknown };
  task_error?: { message?: unknown };
}

function allowedOrigins() {
  const configured = process.env.MUEBLEA_ALLOWED_ORIGINS;
  return new Set((configured ? configured.split(",") : DEFAULT_ALLOWED_ORIGINS).map((origin) => origin.trim()).filter(Boolean));
}

function isOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin || allowedOrigins().has(origin);
}

function corsHeaders(request: Request) {
  const headers = new Headers({ Vary: "Origin" });
  const origin = request.headers.get("origin");
  if (origin && (origin === new URL(request.url).origin || allowedOrigins().has(origin))) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Expose-Headers", "Content-Type, Content-Length");
  }
  return headers;
}

function json(request: Request, body: unknown, status = 200) {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

function providerHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

function apiIsEnabled() {
  return process.env.MUEBLEA_IMAGE3D_ENABLED === "true" && Boolean(process.env.MESHY_API_KEY?.trim());
}

function clientRateLimit(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const attempts = (recentTasksByClient.get(forwardedFor) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (attempts.length >= TASK_LIMIT) {
    recentTasksByClient.set(forwardedFor, attempts);
    return false;
  }
  attempts.push(now);
  recentTasksByClient.set(forwardedFor, attempts);
  return true;
}

function providerFailure(request: Request, status: number) {
  if (status === 401) return json(request, { error: "La clave del servicio 3D no es válida." }, 503);
  if (status === 402) return json(request, { error: "El servicio 3D no tiene créditos disponibles." }, 402);
  if (status === 429) return json(request, { error: "El servicio 3D está ocupado. Inténtalo de nuevo más tarde." }, 429);
  return json(request, { error: "No se pudo completar la solicitud al servicio 3D." }, 502);
}

async function readMeshyResponse(response: Response) {
  try {
    return await response.json() as MeshyTask & { result?: unknown; id?: unknown };
  } catch {
    return null;
  }
}

async function createTask(request: Request) {
  if (!apiIsEnabled()) {
    return json(request, { error: "La generación 3D aún no está configurada en el servidor." }, 503);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_3D_DATA_URI_BYTES * 1.5) {
    return json(request, { error: "La imagen preparada es demasiado pesada. Prueba con otra foto." }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "No pude leer la imagen enviada." }, 400);
  }

  const image = body && typeof body === "object" && "imageDataUri" in body
    ? inspectImage3DDataUri((body as { imageDataUri?: unknown }).imageDataUri)
    : null;
  if (!image) {
    return json(request, { error: "Usa una foto JPG válida de hasta 1,8 MB después de prepararla." }, 400);
  }
  if (!clientRateLimit(request)) {
    return json(request, { error: "Alcanzaste el límite temporal de generación. Espera unos minutos." }, 429);
  }

  let imageDataUri: string;
  try {
    imageDataUri = (body as { imageDataUri: string }).imageDataUri;
    const response = await fetch(MESHY_API, {
      method: "POST",
      headers: providerHeaders(process.env.MESHY_API_KEY!.trim()),
      body: JSON.stringify({ image_url: imageDataUri, should_texture: true, target_formats: ["glb"] }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    const result = await readMeshyResponse(response);
    if (!response.ok) return providerFailure(request, response.status);
    const taskId = typeof result?.result === "string" ? result.result : typeof result?.id === "string" ? result.id : "";
    if (!taskId) return json(request, { error: "El servicio 3D no devolvió una tarea válida." }, 502);
    return json(request, { taskId });
  } catch {
    return json(request, { error: "No se pudo conectar con el servicio 3D. Inténtalo de nuevo." }, 502);
  }
}

async function getTask(request: Request) {
  if (!apiIsEnabled()) {
    return json(request, { error: "La generación 3D aún no está configurada en el servidor." }, 503);
  }

  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId") ?? "";
  if (!/^[A-Za-z0-9_-]{6,100}$/.test(taskId)) {
    return json(request, { error: "La tarea 3D no es válida." }, 400);
  }

  try {
    const taskResponse = await fetch(`${MESHY_API}/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${process.env.MESHY_API_KEY!.trim()}` },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const task = await readMeshyResponse(taskResponse);
    if (!taskResponse.ok || !task) return providerFailure(request, taskResponse.status);

    const status = typeof task.status === "string" ? task.status : "";
    const progress = typeof task.progress === "number" && Number.isFinite(task.progress)
      ? Math.max(0, Math.min(100, task.progress))
      : 0;

    if (status === "SUCCEEDED") {
      const modelUrl = typeof task.model_urls?.glb === "string" ? task.model_urls.glb : "";
      if (!modelUrl) return json(request, { error: "El servicio terminó, pero no generó un archivo GLB." }, 502);

      if (url.searchParams.get("download") === "1") {
        const parsedModelUrl = new URL(modelUrl);
        if (parsedModelUrl.protocol !== "https:" || !parsedModelUrl.hostname.endsWith(".meshy.ai")) {
          return json(request, { error: "La dirección del modelo generado no es válida." }, 502);
        }
        const modelResponse = await fetch(parsedModelUrl, { cache: "no-store", signal: AbortSignal.timeout(60_000) });
        if (!modelResponse.ok || !modelResponse.body) return json(request, { error: "No se pudo descargar el modelo 3D." }, 502);
        const headers = corsHeaders(request);
        headers.set("Content-Type", "model/gltf-binary");
        headers.set("Cache-Control", "private, no-store");
        headers.set("Content-Disposition", "inline; filename=referencia-mueble.glb");
        return new Response(modelResponse.body, { status: 200, headers });
      }

      return json(request, { taskId, status, progress });
    }

    if (status === "PENDING" || status === "IN_PROGRESS") {
      return json(request, { taskId, status, progress });
    }
    if (status === "FAILED" || status === "CANCELED") {
      const message = typeof task.task_error?.message === "string"
        ? task.task_error.message.slice(0, 180)
        : "No se pudo generar el modelo desde esta foto.";
      return json(request, { taskId, status, progress, error: message }, 422);
    }
    return json(request, { error: "El servicio 3D devolvió un estado desconocido." }, 502);
  } catch {
    return json(request, { error: "Se perdió la conexión al revisar el avance del modelo." }, 502);
  }
}

export default {
  async fetch(request: Request) {
    if (!isOriginAllowed(request)) return new Response("Origen no permitido", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method === "POST") return createTask(request);
    if (request.method === "GET") return getTask(request);
    return json(request, { error: "Método no permitido." }, 405);
  },
};
