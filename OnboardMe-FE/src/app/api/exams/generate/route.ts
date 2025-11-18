// Evitar que alguna env antigua fuerce una CARPETA en vez del ejecutable
delete (process as any).env.YT_DLP_PATH;
delete (process as any).env.YTDLP_PATH;
delete (process as any).env.YTDL_PATH;


import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { lookup as lookupMime } from "mime-types";
import path from "node:path";
import fs from "node:fs/promises";
import fss from "node:fs";
import os from "node:os";
import { YoutubeTranscript } from "youtube-transcript";
import mammoth from "mammoth";
import YTDlpWrap from "yt-dlp-wrap";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

const YT_BIN_DIR = path.join(process.cwd(), ".next", "cache", "yt-dlp-bin");
const YT_BIN_SUBDIR = path.join(YT_BIN_DIR, "bin");

// Devuelve la RUTA AL ARCHIVO ejecutable
async function ensureYtDlpPath(): Promise<string> {
    const YT_BIN_NAME = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
    const ALT = process.platform === "win32" ? ["yt-dlp"] : [];

    // 1) Si viene por env y es archivo, usarlo
    const envs = [process.env.YT_DLP_PATH, process.env.YTDLP_PATH, process.env.YTDL_PATH]
        .filter(Boolean) as string[];
    for (const p of envs) {
        try {
            const st = await fs.stat(p);
            if (st.isFile()) return p;
        } catch {}
    }

    // 2) Asegurar carpeta
    await fs.mkdir(YT_BIN_SUBDIR, { recursive: true });

    // 3) Buscar archivos candidatos en subcarpeta/raíz
    const tryFiles = async (paths: string[]) => {
        for (const p of paths) {
            try {
                const st = await fs.stat(p);
                if (st.isFile()) return p;
            } catch {}
        }
        return null;
    };

    const expected = [
        path.join(YT_BIN_SUBDIR, YT_BIN_NAME),
        ...ALT.map(n => path.join(YT_BIN_SUBDIR, n)),
        path.join(YT_BIN_DIR, YT_BIN_NAME),
        ...ALT.map(n => path.join(YT_BIN_DIR, n)),
    ];

    let bin = await tryFiles(expected);

    if (bin) {
        const st = await fs.stat(bin);
        console.log("[yt-dlp] Candidate:", bin, "isFile:", st.isFile(), "isDirectory:", st.isDirectory());
        if (!st.isFile()) throw new Error(`[yt-dlp] Resuelto algo que NO es archivo: ${bin}`);
        return bin;
    }

    // 4) Descargar binarios en un ARCHIVO dentro de la subcarpeta
    try {
        const downloadTarget = path.join(YT_BIN_SUBDIR, YT_BIN_NAME);
        await (YTDlpWrap as any).downloadFromGithub(downloadTarget);

        if (process.platform !== "win32") {
            await fs.chmod(downloadTarget, 0o755);
        }
    } catch (e) {
        console.warn("[yt-dlp] downloadFromGithub warning:", e);
    }

    // 5) Reintentar búsqueda exacta
    bin = await tryFiles(expected);
    if (bin) {
        const st = await fs.stat(bin);
        if (!st.isFile()) throw new Error(`[yt-dlp] Descargado algo que no es archivo: ${bin}`);
        return bin;
    }
    if (bin) return bin;

    try {
        const entries = await fs.readdir(YT_BIN_SUBDIR, { withFileTypes: true });
        const name = entries
            .filter(e => e.isFile())
            .map(e => e.name)
            .find(n => /^yt-dlp(\.exe)?$/i.test(n));
        if (name) return path.join(YT_BIN_SUBDIR, name);
    } catch {}

    throw new Error(`No se encontró ejecutable de yt-dlp en:
- ${expected.join("\n- ")}
Asegurate de que exista un archivo (no carpeta) llamado "yt-dlp.exe" (Windows) o "yt-dlp" (Linux/Mac).`);
}

function findTargetSectionIdx(prompt: string, sections: { title: string }[]): number {
    const txt = (prompt || "").toLowerCase();

    const mSec = txt.match(/secci[oó]n\s+(\d+)/i);
    if (mSec) {
        const idx = Number(mSec[1]) - 1;
        if (Number.isInteger(idx) && idx >= 0 && idx < sections.length) return idx;
    }

    const mQuote = prompt.match(/"([^"]+)"/);
    if (mQuote?.[1]) {
        const needle = mQuote[1].toLowerCase();
        const idx = sections.findIndex(s => (s.title || "").toLowerCase().includes(needle));
        if (idx >= 0) return idx;
    }

    return 0;
}

function fallbackBucketsFromPrompt(prompt: string) {
    const txt = (prompt || "").toLowerCase();

    // conteos
    let so = 0; // single choice (4 opciones por defecto)
    let vf = 0; // single choice de verdadero/falso (2 opciones)
    let mo = 0; // multiple choice

    // Única/una sola respuesta
    if (/\buna\s+pregunta\s+que\s+tenga\s+una\s+sola\s+respuesta\b/.test(txt)) so += 1;
    const mSO = txt.match(/(\d+)\s+(?:de\s+)?(?:\búnica\b|\buna\s+sola\s+respuesta\b)/);
    if (mSO) so += Number(mSO[1]) || 0;

    // Verdadero/Falso variantes: "v/f", "v y f", "verdadero y falso", "verdadero/falso"
    const vfPhrases = [
        /v\s*\/\s*f/i,
        /v\s*y\s*f/i,
        /verdadero\s*(?:\/|y)\s*falso/i,
    ];
    if (vfPhrases.some(re => re.test(prompt))) vf += 1;
    const mVF = txt.match(/(\d+)\s+(?:de\s+)?(?:v\s*[\/y]\s*f|verdadero\s*(?:\/|y)\s*falso)/i);
    if (mVF) vf += Number(mVF[1]) || 0;

    // Múltiples: "más de una", "múltiple(s)"
    if (/m[aá]s\s+de\s+una\s+respuesta/.test(txt)) mo += 1;
    const mMO = txt.match(/(\d+)\s+(?:de\s+)?m[uú]ltiples?/i);
    if (mMO) mo += Number(mMO[1]) || 0;

    // Además, frases tipo "otras 2 preguntas que tengan más de una respuesta"
    const mOtras = txt.match(/otras?\s+(\d+)\s+preguntas?.+m[aá]s\s+de\s+una\s+respuesta/);
    if (mOtras) mo += Number(mOtras[1]) || 0;

    // Armar buckets
    const buckets: Array<{ type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; count: number; optionCount?: number }> = [];
    if (so > 0) buckets.push({ type: "SINGLE_CHOICE", count: so, optionCount: 4 });
    if (vf > 0) buckets.push({ type: "SINGLE_CHOICE", count: vf, optionCount: 2 });
    if (mo > 0) buckets.push({ type: "MULTIPLE_CHOICE", count: mo, optionCount: 4 });
    return buckets;
}

async function getFileMetaByUri(
  ai: GoogleGenAI,
  uri: string,
  timeoutMs = 30000,
  intervalMs = 1000,
) {
  const name = typeof uri === "string" ? uri.split("/").pop() || "" : "";
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const f: any = await ai.files.get({ name });
      if (f?.state === "ACTIVE") return f;
      if (f?.state === "FAILED")
        throw new Error("El archivo en Files API falló al procesar");
    } catch {
      // ignoramos y reintentamos
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Archivo no disponible en Files API (uri=${uri})`);
}

async function waitForFileActive(
  ai: GoogleGenAI,
  uploaded: any,
  displayName: string,
  timeoutMs = 120000,
  intervalMs = 2000,
) {
  // El SDK devuelve algo tipo { uri, name, file?: { name, state } }
  const name =
    uploaded?.file?.name ||
    uploaded?.name ||
    (typeof uploaded?.uri === "string" ? uploaded.uri.split("/").pop() : "");

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // Pedimos el estado actual
    const f: any = await ai.files.get({ name });
    if (f?.state === "ACTIVE") return f;
    if (f?.state === "FAILED") {
      throw new Error(
        `El archivo ${displayName} falló al procesar en Files API`,
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    `El archivo ${displayName} no pasó a ACTIVE dentro del tiempo de espera`,
  );
}

function isYouTubeUrl(u: string) {
  return /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(
    u || "",
  );
}
function isPdfHttpUrl(u: string) {
  return /^https?:\/\//i.test(u || "") && /\.pdf(\?|#|$)/i.test(u || "");
}
function isDriveUrl(u: string) {
  return /^https?:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(u || "");
}

// util: crea carpeta temporal única
async function makeTmpPrefix(prefix = "yt-") {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    return dir;
}

async function downloadWithYtDlp(url: string): Promise<{ file: string; mime: string }> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "yt-"));
    const base = path.join(tmpDir, `audio-${Date.now()}`);
    const outTpl = `${base}.%(ext)s`;

    const bin = await ensureYtDlpPath();
    console.log("[yt-dlp] Using binary:", bin);

    await new Promise<void>((resolve, reject) => {
        const proc = spawn(bin, [
            url,
            "-f", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
            "-o", outTpl,
            "--no-playlist"
        ], { cwd: tmpDir, stdio: "inherit", windowsHide: true });

        proc.on("error", reject);
        proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`yt-dlp exit ${code}`)));
    });

    const candidates = [
        `${base}.m4a`, `${base}.webm`, `${base}.opus`,
        `${base}.mp3`, `${base}.mka`, `${base}.ogg`,
    ];
    for (const f of candidates) {
        try {
            await fs.access(f);
            const ext = path.extname(f).toLowerCase();
            const mime =
                ext === ".m4a" ? "audio/mp4" :
                    ext === ".webm" ? "audio/webm" :
                        ext === ".mp3" ? "audio/mpeg" :
                            ext === ".opus" ? "audio/ogg" :
                                ext === ".ogg" ? "audio/ogg" :
                                    ext === ".mka" ? "audio/x-matroska" :
                                        "application/octet-stream";
            return { file: f, mime };
        } catch {}
    }

    throw new Error("yt-dlp no dejó un archivo de audio detectable");
}

function extractDriveInfo(u: string): {
  kind: "docs" | "file" | "unknown";
  id: string;
} {
  try {
    const url = new URL(u);
    // Google Docs (documentos nativos)
    if (
      /^docs\.google\.com$/i.test(url.hostname) &&
      /\/document\/d\//i.test(url.pathname)
    ) {
      const m = url.pathname.match(/\/document\/d\/([^/]+)/i);
      if (m?.[1]) return { kind: "docs", id: m[1] };
    }
    // Drive file (cualquier archivo subido a Drive)
    if (/^drive\.google\.com$/i.test(url.hostname)) {
      let m = url.pathname.match(/\/file\/d\/([^/]+)/i);
      if (m?.[1]) return { kind: "file", id: m[1] };
      const id = url.searchParams.get("id");
      if (id) return { kind: "file", id };
      const id2 = url.searchParams.get("id");
      if (/\/uc$/i.test(url.pathname) && id2) return { kind: "file", id: id2 };
    }
  } catch {}
  return { kind: "unknown", id: "" };
}

function looksLikePdf(bytes: Buffer) {
  // %PDF- encabezado clásico
  return bytes.slice(0, 5).toString("utf8") === "%PDF-";
}

function safeDispositionName(disposition: string, fallback: string) {
  try {
    const m = disposition.match(/filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i);
    if (m && m[2]) return decodeURIComponent(m[2]);
  } catch {}
  return fallback;
}

// cuenta caracteres de todos los parts de texto (para chequear grounding)
function countTextChars(parts: Array<{ text?: string }>) {
  let n = 0;
  for (const p of parts) {
    if (typeof p.text === "string") n += p.text.length;
  }
  return n;
}

async function fetchDriveFileBytes(fileId: string): Promise<{
  bytes: Buffer;
  contentType: string;
  disposition: string;
}> {
  const commonHeaders: Record<string, string> = {
    "user-agent": "Mozilla/5.0",
    accept:
      "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream,*/*",
    referer: "https://drive.google.com/",
  };

  let resp = await fetch(
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
    { headers: commonHeaders },
  );
  if (resp.ok) {
    const ct = (resp.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("text/html")) {
      const ab = await resp.arrayBuffer();
      return {
        bytes: Buffer.from(ab),
        contentType: ct,
        disposition: resp.headers.get("content-disposition") || "",
      };
    }
  }

  resp = await fetch(
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    { headers: commonHeaders },
  );
  if (!resp.ok) throw new Error(`Drive uc init failed: ${resp.status}`);
  let ct = (resp.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("text/html")) {
    const ab = await resp.arrayBuffer();
    return {
      bytes: Buffer.from(ab),
      contentType: ct,
      disposition: resp.headers.get("content-disposition") || "",
    };
  }

  const html = await resp.text();
  const m = html.match(/confirm=([0-9A-Za-z_]+)[^"'&]*/i);
  const confirm = m?.[1] || "";

  // tomar cookies
  const setCookie = resp.headers.get("set-cookie") || "";
  const cookie = setCookie
    ? setCookie
        .split(",")
        .map((s) => s.split(";")[0])
        .join("; ")
    : "";

  if (!confirm) throw new Error("Drive confirm token not found");

  const resp2 = await fetch(
    `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${fileId}`,
    { headers: cookie ? { ...commonHeaders, cookie } : commonHeaders },
  );
  if (!resp2.ok) throw new Error(`Drive confirm failed: ${resp2.status}`);

  const ab2 = await resp2.arrayBuffer();
  return {
    bytes: Buffer.from(ab2),
    contentType: (resp2.headers.get("content-type") || "").toLowerCase(),
    disposition: resp2.headers.get("content-disposition") || "",
  };
}

async function fetchYouTubeTranscriptServer(
  url: string,
  lang: "es" | "en" = "es",
) {
  const langs = [lang, "es-419", "es-ES", "es", "en"];
  for (const l of langs) {
    const items = await YoutubeTranscript.fetchTranscript(url, {
      lang: l,
    }).catch(() => []);
    if (items && items.length) {
      return items
        .map((i) => i.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  return "";
}

// async function downloadYouTubeAudioToTemp(url: string) {
//   const tmp = path.join(os.tmpdir(), `yt-${Date.now()}.m4a`);
//   await new Promise<void>((resolve, reject) => {
//     const rs = ytdl(url, {
//       quality: "highestaudio",
//       filter: "audioonly",
//       highWaterMark: 1 << 25,
//       requestOptions: {
//         headers: {
//           "user-agent":
//             "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
//           "accept-language": "es-ES,es;q=0.9,en;q=0.8",
//         },
//       },
//     });
//     const ws = fss.createWriteStream(tmp);
//     rs.on("error", reject);
//     ws.on("error", reject);
//     ws.on("finish", () => resolve());
//     rs.pipe(ws);
//   });
//   return tmp;
// }
async function downloadYouTubeAudioToTemp(url: string) {
    return await downloadWithYtDlp(url);
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type SectionIn = {
  title: string;
  type: "VIDEO" | "DOCUMENT" | "IMAGE";
  url?: string;
  textFallback?: string;
  fileUri?: string;
  mimeType?: string;
  displayName?: string;
};

async function transcribeVideoWithGemini(
  ai: GoogleGenAI,
  uri: string,
  mime: string,
  displayName: string,
  lang: "es" | "en",
) {
  const prompt =
    lang === "es"
      ? "Transcribí literalmente el audio del video en español rioplatense. Devolvé SOLO el texto plano, sin marcas de tiempo ni formato adicional."
      : "Transcribe the video's spoken audio to plain English. Return PLAIN text only, no timestamps or extra formatting.";

  const r = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: [
      { fileData: { fileUri: uri, mimeType: mime } },
      { text: prompt },
    ],
    config: { responseMimeType: "text/plain" },
  });
  return (r.text || "").trim();
}

async function preparePartsForSection(
  ai: GoogleGenAI,
  s: SectionIn,
  lang: "es" | "en",
) {
  const parts: any[] = [];
  let label = s.title;

  // --- CASO fileUri (staging directo a Gemini) ---
  if (s.fileUri) {
    // Traemos metadatos canónicos del Files API (mimeType real y estado ACTIVE)
    const meta = await getFileMetaByUri(ai, s.fileUri).catch(() => null);

    if (!meta) {
      // Mensaje claro (evita el genérico "Data not found")
      throw new Error(
        `El archivo staged no está disponible (probá regenerar o reiniciar dev tras cambios de .env)`,
      );
    }

    const mime = (meta as any)?.mimeType || s.mimeType || "application/pdf";
    const name = s.displayName || (meta as any)?.displayName || s.title;
    const _label = `${s.title}${name ? ` (${name})` : ""}`;

    // Anclamos la fuente por fileData (Gemini leerá el PDF directamente)
    parts.push({ fileData: { fileUri: s.fileUri, mimeType: mime } });
    parts.push({ text: `[FUENTE: ${s.type}] ${_label}` });

    // Audio/Video: pedir transcripción adicional
    if (mime.startsWith("video/") || mime.startsWith("audio/")) {
      const transcript = await transcribeVideoWithGemini(
        ai,
        s.fileUri,
        mime,
        name,
        lang,
      ).catch(() => "");
      if (transcript)
        parts.push({
          text: `[TRANSCRIPCIÓN ${name}]\n${transcript.slice(0, 15000)}`,
        });
    }

    return { parts, label: s.title };
  }

  if (s.url && s.url.startsWith("/uploads/")) {
    const rel = (s.url || "").replace(/^\/+/, "");
    const abs = path.join(process.cwd(), "public", rel);
    const displayName = path.basename(abs);
    label = `${s.title} (${displayName})`;

    let mime = (lookupMime(displayName) as string) || "";
    const low = displayName.toLowerCase();

    if (!mime) {
      mime = low.endsWith(".pdf")
        ? "application/pdf"
        : low.endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : low.endsWith(".png")
            ? "image/png"
            : low.endsWith(".jpg") || low.endsWith(".jpeg")
              ? "image/jpeg"
              : low.endsWith(".mp4")
                ? "video/mp4"
                : low.endsWith(".webm")
                  ? "video/webm"
                  : low.endsWith(".mov")
                    ? "video/quicktime"
                    : "application/octet-stream";
    }

    // Correcciones explícitas por si lookupMime devolvió algo raro
    if (low.endsWith(".mp4")) mime = "video/mp4";
    if (low.endsWith(".webm")) mime = "video/webm";
    if (low.endsWith(".mov")) mime = "video/quicktime";
    if (mime === "application/mp4") mime = "video/mp4";

    const bytes = await fs.readFile(abs);

    if (mime === DOCX_MIME || displayName.toLowerCase().endsWith(".docx")) {
      // DOCX: NO subir al Files API (no soportado). Extraer texto y usarlo como fuente.
      try {
        const result = await mammoth.extractRawText({
          buffer: Buffer.from(bytes),
        } as any);
        const text = (result?.value || "").trim();
        parts.push({
          text: `[FUENTE: DOCUMENTO DOCX] ${s.title} (${displayName})`,
        });
        if (text) {
          parts.push({
            text: `[EXTRAÍDO DE DOCX: ${displayName}]\n${text.slice(0, 15000)}`,
          });
        }
      } catch {
        // Si la extracción falla, al menos deja constancia de la fuente
        parts.push({
          text: `[FUENTE: DOCUMENTO DOCX] ${s.title} (${displayName})`,
        });
      }
    } else {
      // Cualquier otro tipo (pdf, imagen, video, etc.) → subir y usar normalmente
      const blob = new Blob([bytes], { type: mime });
      const uploaded = await ai.files.upload({
        file: blob,
        config: { mimeType: mime, displayName },
      });
      await waitForFileActive(ai, uploaded, displayName);

      parts.push({ fileData: { fileUri: uploaded.uri, mimeType: mime } });
      parts.push({ text: `[FUENTE: ${s.type}] ${s.title}` });

      // PDFs: ya están subidos a Files API; Gemini los lee desde fileData.

      // Si es VIDEO, además transcribir audio
      if (mime.startsWith("video/")) {
        const transcript = await transcribeVideoWithGemini(
          ai,
          uploaded.uri,
          mime,
          displayName,
          lang,
        ).catch(() => "");
        if (transcript)
          parts.push({
            text: `[TRANSCRIPCIÓN VIDEO ${displayName}]\n${transcript.slice(0, 15000)}`,
          });
      }
    }
  }

  // --- CASO URL EXTERNA (no /uploads) ---
  if (s.url && !s.url.startsWith("/uploads/")) {
    if (isYouTubeUrl(s.url)) {
        let transcript = await fetchYouTubeTranscriptServer(s.url, lang).catch(() => "");
        if (!transcript) {
            let tmpInfo: { file: string; mime: string } | null = null;
            try {
                tmpInfo = await downloadYouTubeAudioToTemp(s.url);
                const audioBytes = await fs.readFile(tmpInfo.file);
                const audioBlob = new Blob([audioBytes], { type: tmpInfo.mime });

                const uploadedAudio = await ai.files.upload({
                    file: audioBlob,
                    config: {
                        mimeType: tmpInfo.mime,
                        displayName: path.basename(tmpInfo.file),
                    },
                });

                await waitForFileActive(ai, uploadedAudio, path.basename(tmpInfo.file));

                transcript = await transcribeVideoWithGemini(
                    ai,
                    uploadedAudio.uri,
                    tmpInfo.mime,
                    path.basename(tmpInfo.file),
                    lang,
                ).catch(() => "");
            } catch (err) {
                console.error("YT audio fallback failed:", err);
            } finally {
                try { if (tmpInfo?.file) fss.unlinkSync(tmpInfo.file); } catch {}
            }
        }
        if (transcript) {
        parts.push({
          text: `[TRANSCRIPCIÓN YOUTUBE] ${s.title}\n${transcript.slice(0, 15000)}`,
        });
      }
    } else if (isDriveUrl(s.url)) {
      // GOOGLE DRIVE (Docs o File)
      try {
        const { kind, id } = extractDriveInfo(s.url);
        if (id) {
          const commonHeaders: Record<string, string> = {
            "user-agent": "Mozilla/5.0",
            accept: "application/octet-stream,*/*",
            referer: "https://drive.google.com/",
          };

          if (kind === "docs") {
            // Google Docs → export DOCX → mammoth
            const exportUrl = `https://docs.google.com/document/d/${id}/export?format=docx`;
            const resp = await fetch(exportUrl, { headers: commonHeaders });
            if (resp.ok) {
              const ab = await resp.arrayBuffer();
              const bytes = Buffer.from(ab);
              const displayName = `document-${id}.docx`;
              parts.push({
                text: `[FUENTE: GOOGLE DOCS] ${s.title} (${displayName})`,
              });
              try {
                const result = await mammoth.extractRawText({
                  buffer: bytes,
                } as any);
                const raw = (result?.value || "").trim();
                if (raw) {
                  parts.push({
                    text: `[EXTRAÍDO DE DOCX (DRIVE) ${displayName}]\n${raw.slice(0, 15000)}`,
                  });
                }
              } catch {}
            } else {
              console.error("Drive Docs export failed:", resp.status);
            }
          } else if (kind === "file") {
            // Descarga robusta (directo o confirm) + detección por contenido
            const { bytes, contentType, disposition } =
              await fetchDriveFileBytes(id);

            let displayName = safeDispositionName(disposition, "");
            if (!displayName) {
              const ext = contentType.includes("pdf")
                ? ".pdf"
                : contentType.includes(
                      "officedocument.wordprocessingml.document",
                    )
                  ? ".docx"
                  : "";
              displayName = `drive-file-${id}${ext}`;
            }

            // Detección sólida de PDF aunque el content-type sea engañoso
            const contentTypeLower = (contentType || "").toLowerCase();
            const isPdf =
              contentTypeLower.includes("pdf") ||
              displayName.toLowerCase().endsWith(".pdf") ||
              looksLikePdf(bytes);

            parts.push({
              text: `[FUENTE: DRIVE FILE] ${s.title} (${displayName})`,
            });

            if (isPdf) {
              const pdfBlob = new Blob([bytes], { type: "application/pdf" });
              const uploadedPdf = await ai.files.upload({
                file: pdfBlob,
                config: { mimeType: "application/pdf", displayName },
              });
              await waitForFileActive(ai, uploadedPdf, displayName);
              parts.push({
                fileData: {
                  fileUri: uploadedPdf.uri,
                  mimeType: "application/pdf",
                },
              });
            } else if (
              contentTypeLower.includes(
                "officedocument.wordprocessingml.document",
              ) ||
              displayName.toLowerCase().endsWith(".docx")
            ) {
              try {
                const result = await mammoth.extractRawText({
                  buffer: bytes,
                } as any);
                const raw = (result?.value || "").trim();
                if (raw) {
                  parts.push({
                    text: `[EXTRAÍDO DE DOCX (DRIVE) ${displayName}]\n${raw.slice(0, 15000)}`,
                  });
                } else {
                  parts.push({
                    text: `[AVISO] El DOCX ${displayName} no tiene texto extraíble.`,
                  });
                }
              } catch (e) {
                console.error("mammoth drive failed:", e);
              }
            } else {
              parts.push({
                text: `[AVISO] El archivo de Drive (${displayName}) no es PDF ni DOCX público.`,
              });
            }
          }
        }
      } catch (err) {
        console.error("Drive handling failed:", err);
      }
    } else if (isPdfHttpUrl(s.url)) {
      try {
        const u = new URL(s.url);
        const headers: Record<string, string> = {
          "user-agent": "Mozilla/5.0",
          accept: "application/pdf,application/octet-stream,*/*",
          referer: `${u.protocol}//${u.host}/`,
        };
        if (u.hostname.endsWith("eric.ed.gov")) {
          headers["referer"] = "https://eric.ed.gov/";
        }

        const resp = await fetch(s.url, { headers });
        if (!resp.ok) {
          console.error("Fetch .pdf link HTTP error:", resp.status, s.url);
        } else {
          const ab = await resp.arrayBuffer();
          const bytes = Buffer.from(ab);

          let displayName = "";
          try {
            const cd = resp.headers.get("content-disposition") || "";
            displayName = safeDispositionName(cd, "");
          } catch {}
          if (!displayName) {
            const last = u.pathname.split("/").pop() || "";
            displayName = decodeURIComponent(
              last || `${s.title.replace(/[^\w.-]+/g, "_")}.pdf`,
            );
            if (!displayName.toLowerCase().endsWith(".pdf"))
              displayName += ".pdf";
          }

          const pdfBlob = new Blob([bytes], { type: "application/pdf" });
          const uploadedPdf = await ai.files.upload({
            file: pdfBlob,
            config: { mimeType: "application/pdf", displayName },
          });
          await waitForFileActive(ai, uploadedPdf, displayName);

          parts.push({
            fileData: { fileUri: uploadedPdf.uri, mimeType: "application/pdf" },
          });
          parts.push({
            text: `[FUENTE: PDF LINK] ${s.title} (${displayName})`,
          });
        }
      } catch (err) {
        console.error("Fetch .pdf link failed:", err);
      }
    } else if (s.textFallback && s.textFallback.trim()) {
      parts.push({ text: `[TEXTO] ${s.title}\n\n${s.textFallback}` });
    }
  }

  return { parts, label };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
      const sections = (body?.sections ?? []) as SectionIn[];
      const lang = (body?.lang ?? "es") as "es" | "en";

      const distribution = (body?.distribution ?? {}) as { SINGLE_CHOICE?: number; MULTIPLE_CHOICE?: number };

      type SourceOverride = { index?: number; label?: string; SINGLE_CHOICE?: number; MULTIPLE_CHOICE?: number; focus?: string };
      const overrides = Array.isArray(body?.overrides) ? (body.overrides as SourceOverride[]) : [];

      const perSourceMin = Number(body?.perSourceMin ?? 5);
      const customPrompt = String(body?.customPrompt || "").trim();

      if (!Array.isArray(sections) || sections.length === 0) {
          return NextResponse.json({ error: "No hay secciones fuente" }, { status: 400 });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

      const plan = sections.map((_s, i) => ({
          SINGLE_CHOICE: 0,
          MULTIPLE_CHOICE: 0,
          focus: undefined as string | undefined,
          index: i,
      }));

      // Buckets detallados por seccion, provenientes del prompt libre (opcional)
      const detailed: Record<number, Array<{ type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; count: number; optionCount?: number }>> = {};

      // Si hay prompt libre, lo traducimos a buckets por sección (índice)
      if (customPrompt) {
          // Lista indexada para que el modelo pueda referir por número o por título
          const indexList = sections.map((s, i) => `${i}: ${s.title}`).join("\n");

          const parsingSchema = {
              type: "object",
              properties: {
                  byIndex: {
                      type: "array",
                      items: {
                          type: "object",
                          properties: {
                              index: { type: "integer", minimum: 0, maximum: sections.length - 1 },
                              items: {
                                  type: "array",
                                  items: {
                                      type: "object",
                                      properties: {
                                          type: { type: "string", enum: ["SINGLE_CHOICE", "MULTIPLE_CHOICE"] },
                                          count: { type: "integer", minimum: 0, maximum: 50 },
                                          optionCount: { type: "integer", minimum: 2, maximum: 10 },
                                      },
                                      required: ["type", "count"],
                                      additionalProperties: false,
                                  },
                                  minItems: 1,
                              },
                          },
                          required: ["index", "items"],
                          additionalProperties: false,
                      },
                  },
              },
              required: ["byIndex"],
              additionalProperties: false,
          };

          const sysParse =
              lang === "es"
                  ? `Vas a leer el pedido del usuario y convertirlo en un plan ESTRICTAMENTE en JSON.`
                  : `Read the user's request and convert it into a STRICT JSON plan.`;

          const taskParse =
              lang === "es"
                  ? `Secciones (index: título):
${indexList}

Pedido del usuario:
${customPrompt}

Requisitos IMPORTANTES:
- Devolvé SOLO JSON con este esquema: ${JSON.stringify(parsingSchema)}.
- El resultado del prompt es SIEMPRE ADITIVO a lo que ya configuró el usuario en la UI (NO lo reemplaza).
- Cantidad de opciones por defecto = 4.
- Usá optionCount = 2 SOLO si el usuario pide explícitamente "verdadero/falso", "v/f", "vero/falso" o "dos opciones" para ESA pregunta, y SOLO si type = "SINGLE_CHOICE".
- Interpretá “verdadero/falso”, “verdadero o falso”, “vero/falso”, “v/f”, “vf”, “v y f”, “true/false”, “t/f” como SINGLE_CHOICE con optionCount=2.
- NO pongas optionCount=2 en preguntas "MULTIPLE_CHOICE" salvo que el usuario diga explícitamente "dos opciones" para esas múltiples (de lo contrario dejá 4).
- Si algo es ambiguo, devolvé count=0 para ese item.`
                  : `Sections (index: title):
${indexList}

User request:
${customPrompt}

STRICT rules:
- Reply JSON ONLY with schema: ${JSON.stringify(parsingSchema)}.
- The free prompt PLAN is ADDITIVE to the UI counts (never replaces them).
- Default optionCount = 4.
- Use optionCount = 2 ONLY when the user explicitly asks "true/false", "t/f", "two options" for THAT item, and ONLY if type = "SINGLE_CHOICE".
- NEVER set optionCount=2 for MULTIPLE_CHOICE unless explicitly asked for those multiple items; otherwise keep 4.
- If ambiguous, set count=0.`;

          const parsedResp = await ai.models.generateContent({
              model: "gemini-2.0-flash-001",
              contents: [{ text: sysParse }, { text: taskParse }],
              config: { responseMimeType: "application/json" },
          }).catch(() => null);

          let extra: any = null;
          try { extra = parsedResp?.text ? JSON.parse(parsedResp.text) : null; } catch { extra = null; }

          if (extra?.byIndex && Array.isArray(extra.byIndex)) {
              for (const entry of extra.byIndex) {
                  const idx = Number(entry?.index);
                  if (!Number.isInteger(idx) || idx < 0 || idx >= sections.length) continue;

                  const items = Array.isArray(entry.items) ? entry.items : [];
                  for (const it of items) {
                      const type = it?.type === "MULTIPLE_CHOICE" ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE";
                      const count = Math.max(0, Number(it?.count || 0));
                      const optionCount = Math.max(2, Math.min(10, Number(it?.optionCount || 0))) || undefined;

                      // Guardar bucket detallado
                      if (!detailed[idx]) detailed[idx] = [];
                      detailed[idx].push({ type, count, optionCount });
                  }
              }
          }
      }

      // --- FALLBACK HEURÍSTICO SI EL PARSER NO DEVOLVIÓ NADA ---
      if (customPrompt && Object.keys(detailed).length === 0) {
          const idx = findTargetSectionIdx(customPrompt, sections);
          const fb = fallbackBucketsFromPrompt(customPrompt);

          if (fb.length > 0) {
              detailed[idx] = [...(detailed[idx] || []), ...fb];
          }
      }

      for (const o of overrides) {
          const idx = Number.isInteger(o.index)
              ? Number(o.index)
              : -1;
          if (idx >= 0 && idx < plan.length) {
              plan[idx].SINGLE_CHOICE = Math.max(0, Number(o.SINGLE_CHOICE ?? 0));
              plan[idx].MULTIPLE_CHOICE = Math.max(0, Number(o.MULTIPLE_CHOICE ?? 0));
              if (o.focus) plan[idx].focus = String(o.focus);
          }
      }

      const globalSO = Math.max(0, Number(distribution.SINGLE_CHOICE ?? 0));
      const globalMO = Math.max(0, Number(distribution.MULTIPLE_CHOICE ?? 0));
      const alreadySO = plan.reduce((a, p) => a + p.SINGLE_CHOICE, 0);
      const alreadyMO = plan.reduce((a, p) => a + p.MULTIPLE_CHOICE, 0);
      const remainSO = Math.max(0, globalSO - alreadySO);
      const remainMO = Math.max(0, globalMO - alreadyMO);
      if (plan.length > 0) {
          const evenSO = Math.floor(remainSO / plan.length);
          const evenMO = Math.floor(remainMO / plan.length);
          const soR = remainSO % plan.length;
          const moR = remainMO % plan.length;
          plan.forEach((p, i) => {
              p.SINGLE_CHOICE += evenSO + (i < soR ? 1 : 0);
              p.MULTIPLE_CHOICE += evenMO + (i < moR ? 1 : 0);
          });
      }

      const hasAnyOverride = overrides.some(
          o => (Number(o.SINGLE_CHOICE ?? 0) + Number(o.MULTIPLE_CHOICE ?? 0)) > 0
      );
      const hasGlobal =
          Number.isFinite(distribution?.SINGLE_CHOICE) ||
          Number.isFinite(distribution?.MULTIPLE_CHOICE);
      const hasPrompt = !!customPrompt;

      const emptyPlan = plan.every(p => (p.SINGLE_CHOICE + p.MULTIPLE_CHOICE) === 0);

      if (emptyPlan && !hasAnyOverride && !hasGlobal && !hasPrompt) {
          plan.forEach(p => {
              p.SINGLE_CHOICE = 3;
              p.MULTIPLE_CHOICE = 2;
          });
      }

      if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: "No hay secciones fuente" },
        { status: 400 },
      );
    }

      const planTotal = plan.reduce((a, p) => a + p.SINGLE_CHOICE + p.MULTIPLE_CHOICE, 0);

      const detailedTotal = Object.values(detailed).reduce(
          (acc, arr) => acc + arr.reduce((a, b) => a + (b?.count || 0), 0),
          0
      );

      if (planTotal === 0 && detailedTotal === 0) {
          return NextResponse.json({ questions: [] }, { status: 200 });
      }

      const allQuestions: any[] = [];

      for (const [i, s] of (sections as SectionIn[]).entries()) {
          const planForThis = plan[i];
          const perSourceSO = planForThis?.SINGLE_CHOICE ?? 0;
          const perSourceMO = planForThis?.MULTIPLE_CHOICE ?? 0;
          const perSourceTotal = perSourceSO + perSourceMO;

          const hasDetailedForThis =
              Array.isArray(detailed[i]) && detailed[i].some(b => (b?.count || 0) > 0);

          const hasFocus = !!planForThis?.focus;

          if (perSourceTotal === 0 && !hasDetailedForThis && !hasFocus) {
              continue;
          }

          const { parts, label } = await preparePartsForSection(ai, s, lang);

          const textChars = countTextChars(parts);
          const hasFileRef = parts.some((p: any) => (p as any).fileData);
          if (!hasFileRef && textChars < 120) {
              console.warn(`Fuente "${label}" salteada por falta de texto (chars=${textChars})`);
              continue;
          }
          if (!parts.length) continue;

          if (hasFocus) {
              parts.push({
                  text: lang === "es"
                      ? `[INSTRUCCIÓN DEL USUARIO - FOCO] Concentrarse en: ${planForThis.focus}`
                      : `[USER INSTRUCTION - FOCUS] Focus on: ${planForThis.focus}`,
              });
          }

          const buckets: Array<{ type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; count: number; optionCount?: number }> = [];
          if (perSourceSO > 0) buckets.push({ type: "SINGLE_CHOICE",  count: perSourceSO, optionCount: 4 });
          if (perSourceMO > 0) buckets.push({ type: "MULTIPLE_CHOICE", count: perSourceMO, optionCount: 4 });
          if (hasDetailedForThis) buckets.push(...detailed[i]);

          const items: any[] = [];
          let expectedTotal = 0;
          for (const b of buckets) {
              const rawOpt = Number(b.optionCount || 4);
              let optN = Math.max(2, Math.min(10, rawOpt));
              if (b.type === "MULTIPLE_CHOICE" && optN < 3) optN = 4;

              if (b.type === "SINGLE_CHOICE") {
                  for (let k = 0; k < b.count; k++) {
                      items.push({
                          type: "object",
                          properties: {
                              text: { type: "string" },
                              type: { const: "SINGLE_CHOICE" },
                              options: { type: "array", items: { type: "string" }, minItems: optN, maxItems: optN },
                              correctIndex: { type: "integer", minimum: 0, maximum: optN - 1 },
                              sourceRef: { type: "string" },
                              evidence: { type: "string" },
                          },
                          required: ["text", "type", "options", "correctIndex", "sourceRef", "evidence"],
                          additionalProperties: false,
                      });
                      expectedTotal++;
                  }
              } else {
                  for (let k = 0; k < b.count; k++) {
                      items.push({
                          type: "object",
                          properties: {
                              text: { type: "string" },
                              type: { const: "MULTIPLE_CHOICE" },
                              options: { type: "array", items: { type: "string" }, minItems: optN, maxItems: optN },
                              correctIndices: {
                                  type: "array",
                                  items: { type: "integer", minimum: 0, maximum: optN - 1 },
                                  minItems: 2,
                                  maxItems: optN - 1,
                              },
                              sourceRef: { type: "string" },
                              evidence: { type: "string" },
                          },
                          required: ["text", "type", "options", "correctIndices", "sourceRef", "evidence"],
                          additionalProperties: false,
                      });
                      expectedTotal++;
                  }
              }
          }

          const itemSpecs: Array<{ type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; optionCount: number }> = [];
          for (const b of buckets) {
              const rawOpt = Number(b.optionCount || 4);
              let optN = Math.max(2, Math.min(10, rawOpt));
              if (b.type === "MULTIPLE_CHOICE" && optN < 3) optN = 4;
              for (let k = 0; k < b.count; k++) itemSpecs.push({ type: b.type, optionCount: optN });
          }
          if (expectedTotal === 0) continue;

          const baseItemSchema = {
              type: "object",
              properties: {
                  text: { type: "string" },
                  type: { type: "string", enum: ["SINGLE_CHOICE", "MULTIPLE_CHOICE"] },
                  options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 10 },
                  correctIndex: { type: "integer", minimum: 0, maximum: 9 },
                  correctIndices: { type: "array", items: { type: "integer", minimum: 0, maximum: 9 }, minItems: 1, maxItems: 10 },
                  sourceRef: { type: "string" },
                  evidence: { type: "string" },
              },
              required: ["text", "type", "options", "sourceRef", "evidence"],
              additionalProperties: false,
          } as const;

          const schemaHint = {
              type: "object",
              properties: {
                  questions: { type: "array", items: baseItemSchema, minItems: expectedTotal, maxItems: expectedTotal }
              },
              required: ["questions"],
              additionalProperties: false,
          } as const;

          const specLines = itemSpecs.map((s, i) => `${i + 1}. ${s.type} con ${s.optionCount} opciones`).join("\n");
          const vfHint = lang === "es"
              ? `Para los ítems con optionCount=2, usá formato de Verdadero/Falso (o equivalente) y exactamente dos opciones.`
              : `For items with optionCount=2, use True/False-style (or equivalent) with exactly two options.`;

          const sys = lang === "es"
              ? `Sos un generador de preguntas de opción múltiple de alta calidad.
- Debés anclar cada pregunta a la fuente (usar 'sourceRef') y explicar brevemente ('evidence').
- Respetá ESTRICTAMENTE el esquema y la cantidad de items.`
              : `You are a high-quality multiple-choice question generator.
- Anchor each question to the source ('sourceRef') and include brief 'evidence').
- STRICTLY follow the schema and items count.`;

          const task = lang === "es"
              ? `Generá EXACTAMENTE ${expectedTotal} preguntas de ESTA FUENTE SOLA (${label}).
- Debés seguir este orden y formato EXÁCTO, ítem por ítem:
${specLines}
- ${vfHint}
- Para cada ítem respetá {type} y la cantidad de opciones indicada (exacta).
- Variá dificultad. Incluir 'type', 'sourceRef' (${label} + página/tiempo si aplica) y 'evidence'.
- Cada item DEBE incluir: "text", "type", "options", y "correctIndex" (si SINGLE_CHOICE) o "correctIndices" (si MULTIPLE_CHOICE).
- Si no alcanza el material para cumplir CUALQUIERA de los ítems, devolvé {"questions": []}.
- Entregá SOLO JSON válido que cumpla el schema.`
              : `Generate EXACTLY ${expectedTotal} questions from THIS SINGLE SOURCE ONLY (${label}).
- Follow this exact order and format, item by item:
${specLines}
- ${vfHint}
- ... same as ES ...`;

          const resp = await ai.models.generateContent({
              model: "gemini-2.0-flash-001",
              contents: [parts, { text: sys }, { text: task }].flat(),
              config: { responseMimeType: "application/json", responseSchema: schemaHint },
          });

          const raw = resp.text || "{}";
          let parsed: any;
          try { parsed = JSON.parse(raw); } catch { parsed = { questions: [] }; }

          const safeArr = Array.isArray(parsed?.questions) ? parsed.questions : [];

          const prelim = safeArr.filter((q: any) =>
              typeof q?.text === "string" &&
              q.text.trim() &&
              Array.isArray(q?.options) &&
              q.options.length >= 2 &&
              (q?.type === "SINGLE_CHOICE" || q?.type === "MULTIPLE_CHOICE")
          );

          const enforced = prelim.slice(0, itemSpecs.length).map((q: any, idx: number) => {
              const spec = itemSpecs[idx];
              const optN = spec.optionCount;
              let options: string[] = Array.isArray(q?.options) ? q.options.map((o: any) => String(o ?? "")) : [];
              if (options.length > optN) options = options.slice(0, optN);
              while (options.length < optN) options.push("");

              if (spec.type === "SINGLE_CHOICE") {
                  const ciRaw = Number(q?.correctIndex);
                  let correctIndex = Number.isInteger(ciRaw) && ciRaw >= 0 && ciRaw < optN ? ciRaw : 0;
                  if (Array.isArray(q?.correctIndices) && q.correctIndices.length > 0) {
                      const cand = Number(q.correctIndices[0]);
                      if (Number.isInteger(cand) && cand >= 0 && cand < optN) correctIndex = cand;
                  }
                  return {
                      text: String(q?.text || "").trim(),
                      type: "SINGLE_CHOICE",
                      options,
                      correctIndex,
                      sourceRef: String(q?.sourceRef || label),
                      evidence: String(q?.evidence || "").trim(),
                  };
              } else {
                  let inds = Array.isArray(q?.correctIndices)
                      ? q.correctIndices.map((n: any) => Number(n)).filter(n => Number.isInteger(n) && n >= 0 && n < optN)
                      : [];
                  if (inds.length < 2 && Number.isInteger(q?.correctIndex)) {
                      const base = Math.min(Math.max(0, Number(q.correctIndex)), optN - 1);
                      const second = base === 0 ? 1 : 0;
                      inds = [...new Set([base, second])].slice(0, Math.min(2, optN));
                  }
                  if (inds.length < 2) inds = [0, 1].slice(0, Math.min(2, optN));
                  return {
                      text: String(q?.text || "").trim(),
                      type: "MULTIPLE_CHOICE",
                      options,
                      correctIndices: inds,
                      sourceRef: String(q?.sourceRef || label),
                      evidence: String(q?.evidence || "").trim(),
                  };
              }
          });

          const finalForThisSource = enforced.slice(0, expectedTotal);
          allQuestions.push(...finalForThisSource);
      }

      return NextResponse.json({ questions: allQuestions });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Error inesperado" },
      { status: 500 },
    );
  }
}
