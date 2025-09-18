import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { lookup as lookupMime } from "mime-types"
import path from "node:path"
import fs from "node:fs/promises"
import fss from "node:fs"
import os from "node:os"
import { YoutubeTranscript } from "youtube-transcript"
import ytdl from "@distube/ytdl-core"
import mammoth from "mammoth"

export const runtime = "nodejs"

async function getFileMetaByUri(ai: GoogleGenAI, uri: string, timeoutMs = 30000, intervalMs = 1000) {
  const name = typeof uri === "string" ? uri.split("/").pop() || "" : ""
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const f: any = await ai.files.get({ name })
      if (f?.state === "ACTIVE") return f
      if (f?.state === "FAILED") throw new Error("El archivo en Files API falló al procesar")
    } catch {
      // ignoramos y reintentamos
    }
    await new Promise(r => setTimeout(r, intervalMs))
  }
  throw new Error(`Archivo no disponible en Files API (uri=${uri})`)
}

async function waitForFileActive(ai: GoogleGenAI, uploaded: any, displayName: string, timeoutMs = 120000, intervalMs = 2000) {
  // El SDK devuelve algo tipo { uri, name, file?: { name, state } }
  const name =
    uploaded?.file?.name ||
    uploaded?.name ||
    (typeof uploaded?.uri === "string" ? uploaded.uri.split("/").pop() : "")

  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    // Pedimos el estado actual
    const f: any = await ai.files.get({ name })
    if (f?.state === "ACTIVE") return f
    if (f?.state === "FAILED") {
      throw new Error(`El archivo ${displayName} falló al procesar en Files API`)
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`El archivo ${displayName} no pasó a ACTIVE dentro del tiempo de espera`)
}

function isYouTubeUrl(u: string) {
  return /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(u || "")
}
function isPdfHttpUrl(u: string) {
  return /^https?:\/\//i.test(u || "") && /\.pdf(\?|#|$)/i.test(u || "")
}
function isDriveUrl(u: string) {
  return /^https?:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(u || "")
}

function extractDriveInfo(u: string): { kind: "docs" | "file" | "unknown"; id: string } {
  try {
    const url = new URL(u)
    // Google Docs (documentos nativos)
    if (/^docs\.google\.com$/i.test(url.hostname) && /\/document\/d\//i.test(url.pathname)) {
      const m = url.pathname.match(/\/document\/d\/([^/]+)/i)
      if (m?.[1]) return { kind: "docs", id: m[1] }
    }
    // Drive file (cualquier archivo subido a Drive)
    if (/^drive\.google\.com$/i.test(url.hostname)) {
      let m = url.pathname.match(/\/file\/d\/([^/]+)/i)
      if (m?.[1]) return { kind: "file", id: m[1] }
      const id = url.searchParams.get("id")
      if (id) return { kind: "file", id }
      const id2 = url.searchParams.get("id")
      if (/\/uc$/i.test(url.pathname) && id2) return { kind: "file", id: id2 }
    }
  } catch {}
  return { kind: "unknown", id: "" }
}

function looksLikePdf(bytes: Buffer) {
  // %PDF- encabezado clásico
  return bytes.slice(0, 5).toString("utf8") === "%PDF-"
}

function safeDispositionName(disposition: string, fallback: string) {
  try {
    const m = disposition.match(/filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i)
    if (m && m[2]) return decodeURIComponent(m[2])
  } catch {}
  return fallback
}

// cuenta caracteres de todos los parts de texto (para chequear grounding)
function countTextChars(parts: Array<{ text?: string }>) {
  let n = 0
  for (const p of parts) {
    if (typeof p.text === "string") n += p.text.length
  }
  return n
}

async function fetchDriveFileBytes(fileId: string): Promise<{
  bytes: Buffer
  contentType: string
  disposition: string
}> {
  const commonHeaders: Record<string, string> = {
    "user-agent": "Mozilla/5.0",
    "accept": "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream,*/*",
    "referer": "https://drive.google.com/",
  }

  let resp = await fetch(
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
    { headers: commonHeaders }
  )
  if (resp.ok) {
    const ct = (resp.headers.get("content-type") || "").toLowerCase()
    if (!ct.includes("text/html")) {
      const ab = await resp.arrayBuffer()
      return {
        bytes: Buffer.from(ab),
        contentType: ct,
        disposition: resp.headers.get("content-disposition") || "",
      }
    }
  }

  resp = await fetch(
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    { headers: commonHeaders }
  )
  if (!resp.ok) throw new Error(`Drive uc init failed: ${resp.status}`)
  let ct = (resp.headers.get("content-type") || "").toLowerCase()
  if (!ct.includes("text/html")) {
    const ab = await resp.arrayBuffer()
    return {
      bytes: Buffer.from(ab),
      contentType: ct,
      disposition: resp.headers.get("content-disposition") || "",
    }
  }

  const html = await resp.text()
  const m = html.match(/confirm=([0-9A-Za-z_]+)[^"'&]*/i)
  const confirm = m?.[1] || ""

  // tomar cookies
  const setCookie = resp.headers.get("set-cookie") || ""
  const cookie = setCookie
    ? setCookie.split(",").map(s => s.split(";")[0]).join("; ")
    : ""

  if (!confirm) throw new Error("Drive confirm token not found")

  const resp2 = await fetch(
    `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${fileId}`,
    { headers: cookie ? { ...commonHeaders, cookie } : commonHeaders }
  )
  if (!resp2.ok) throw new Error(`Drive confirm failed: ${resp2.status}`)

  const ab2 = await resp2.arrayBuffer()
  return {
    bytes: Buffer.from(ab2),
    contentType: (resp2.headers.get("content-type") || "").toLowerCase(),
    disposition: resp2.headers.get("content-disposition") || "",
  }
}

async function fetchYouTubeTranscriptServer(url: string, lang: "es" | "en" = "es") {
  const langs = [lang, "es-419", "es-ES", "es", "en"]
  for (const l of langs) {
    const items = await YoutubeTranscript.fetchTranscript(url, { lang: l }).catch(() => [])
    if (items && items.length) {
      return items.map(i => i.text).join(" ").replace(/\s+/g, " ").trim()
    }
  }
  return ""
}

async function downloadYouTubeAudioToTemp(url: string) {
  const tmp = path.join(os.tmpdir(), `yt-${Date.now()}.m4a`)
  await new Promise<void>((resolve, reject) => {
    const rs = ytdl(url, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 25,
      requestOptions: {
        headers: {
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          "accept-language": "es-ES,es;q=0.9,en;q=0.8",
        },
      },
    })
    const ws = fss.createWriteStream(tmp)
    rs.on("error", reject)
    ws.on("error", reject)
    ws.on("finish", () => resolve())
    rs.pipe(ws)
  })
  return tmp
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

type SectionIn = {
  title: string
  type: "VIDEO" | "DOCUMENT" | "IMAGE"
  url?: string
  textFallback?: string
  fileUri?: string
  mimeType?: string
  displayName?: string
}

async function transcribeVideoWithGemini(ai: GoogleGenAI, uri: string, mime: string, displayName: string, lang: "es" | "en") {
  const prompt = lang === "es"
    ? "Transcribí literalmente el audio del video en español rioplatense. Devolvé SOLO el texto plano, sin marcas de tiempo ni formato adicional."
    : "Transcribe the video's spoken audio to plain English. Return PLAIN text only, no timestamps or extra formatting."

  const r = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: [
      { fileData: { fileUri: uri, mimeType: mime } },
      { text: prompt },
    ],
    config: { responseMimeType: "text/plain" },
  })
  return (r.text || "").trim()
}

async function preparePartsForSection(ai: GoogleGenAI, s: SectionIn, lang: "es" | "en") {
  const parts: any[] = []
  let label = s.title

  // --- CASO fileUri (staging directo a Gemini) ---
  if (s.fileUri) {
    // Traemos metadatos canónicos del Files API (mimeType real y estado ACTIVE)
    const meta = await getFileMetaByUri(ai, s.fileUri).catch(() => null)

    if (!meta) {
      // Mensaje claro (evita el genérico "Data not found")
      throw new Error(`El archivo staged no está disponible (probá regenerar o reiniciar dev tras cambios de .env)`)
    }

    const mime = (meta as any)?.mimeType || s.mimeType || "application/pdf"
    const name = s.displayName || (meta as any)?.displayName || s.title
    const _label = `${s.title}${name ? ` (${name})` : ""}`

    // Anclamos la fuente por fileData (Gemini leerá el PDF directamente)
    parts.push({ fileData: { fileUri: s.fileUri, mimeType: mime } })
    parts.push({ text: `[FUENTE: ${s.type}] ${_label}` })

    // Audio/Video: pedir transcripción adicional
    if (mime.startsWith("video/") || mime.startsWith("audio/")) {
      const transcript = await transcribeVideoWithGemini(ai, s.fileUri, mime, name, lang).catch(() => "")
      if (transcript) parts.push({ text: `[TRANSCRIPCIÓN ${name}]\n${transcript.slice(0, 15000)}` })
    }

    return { parts, label: s.title }
  }

  if (s.url && s.url.startsWith("/uploads/")) {
    const rel = (s.url || "").replace(/^\/+/, "")
    const abs = path.join(process.cwd(), "public", rel)
    const displayName = path.basename(abs)
    label = `${s.title} (${displayName})`

    let mime = (lookupMime(displayName) as string) || ""
    const low = displayName.toLowerCase()

    if (!mime) {
      mime = low.endsWith(".pdf") ? "application/pdf"
        : low.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : low.endsWith(".png") ? "image/png"
        : (low.endsWith(".jpg") || low.endsWith(".jpeg")) ? "image/jpeg"
        : low.endsWith(".mp4") ? "video/mp4"
        : low.endsWith(".webm") ? "video/webm"
        : low.endsWith(".mov") ? "video/quicktime"
        : "application/octet-stream"
    }

    // Correcciones explícitas por si lookupMime devolvió algo raro
    if (low.endsWith(".mp4")) mime = "video/mp4"
    if (low.endsWith(".webm")) mime = "video/webm"
    if (low.endsWith(".mov")) mime = "video/quicktime"
    if (mime === "application/mp4") mime = "video/mp4"

    const bytes = await fs.readFile(abs)

    if (mime === DOCX_MIME || displayName.toLowerCase().endsWith(".docx")) {
      // DOCX: NO subir al Files API (no soportado). Extraer texto y usarlo como fuente.
      try {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) } as any)
        const text = (result?.value || "").trim()
        parts.push({ text: `[FUENTE: DOCUMENTO DOCX] ${s.title} (${displayName})` })
        if (text) {
          parts.push({ text: `[EXTRAÍDO DE DOCX: ${displayName}]\n${text.slice(0, 15000)}` })
        }
      } catch {
        // Si la extracción falla, al menos deja constancia de la fuente
        parts.push({ text: `[FUENTE: DOCUMENTO DOCX] ${s.title} (${displayName})` })
      }
    } else {
      // Cualquier otro tipo (pdf, imagen, video, etc.) → subir y usar normalmente
      const blob = new Blob([bytes], { type: mime })
      const uploaded = await ai.files.upload({ file: blob, config: { mimeType: mime, displayName } })
      await waitForFileActive(ai, uploaded, displayName)

      parts.push({ fileData: { fileUri: uploaded.uri, mimeType: mime } })
      parts.push({ text: `[FUENTE: ${s.type}] ${s.title}` })

      // PDFs: ya están subidos a Files API; Gemini los lee desde fileData.

      // Si es VIDEO, además transcribir audio
      if (mime.startsWith("video/")) {
        const transcript = await transcribeVideoWithGemini(ai, uploaded.uri, mime, displayName, lang).catch(() => "")
        if (transcript) parts.push({ text: `[TRANSCRIPCIÓN VIDEO ${displayName}]\n${transcript.slice(0, 15000)}` })
      }

    }
  }

  // --- CASO URL EXTERNA (no /uploads) ---
  if (s.url && !s.url.startsWith("/uploads/")) {

    if (isYouTubeUrl(s.url)) {
      let transcript = await fetchYouTubeTranscriptServer(s.url, lang).catch(() => "")
      if (!transcript) {
        let tmpAudio = ""
        try {
          tmpAudio = await downloadYouTubeAudioToTemp(s.url)
          const audioBytes = await fs.readFile(tmpAudio)
          const audioBlob = new Blob([audioBytes], { type: "audio/mp4" })
          const uploadedAudio = await ai.files.upload({
            file: audioBlob,
            config: { mimeType: "audio/mp4", displayName: path.basename(tmpAudio) },
          })
          await waitForFileActive(ai, uploadedAudio, path.basename(tmpAudio))
          transcript = await transcribeVideoWithGemini(
            ai, uploadedAudio.uri, "audio/mp4", path.basename(tmpAudio), lang
          ).catch(() => "")
        } catch (err) {
          console.error("YT audio fallback failed:", err)
        } finally {
          try { if (tmpAudio) fss.unlinkSync(tmpAudio) } catch {}
        }
      }
      if (transcript) {
        parts.push({ text: `[TRANSCRIPCIÓN YOUTUBE] ${s.title}\n${transcript.slice(0, 15000)}` })
      }

    } else if (isDriveUrl(s.url)) {
      // GOOGLE DRIVE (Docs o File)
      try {
        const { kind, id } = extractDriveInfo(s.url)
        if (id) {
          const commonHeaders: Record<string, string> = {
            "user-agent": "Mozilla/5.0",
            "accept": "application/octet-stream,*/*",
            "referer": "https://drive.google.com/",
          }

          if (kind === "docs") {
            // Google Docs → export DOCX → mammoth
            const exportUrl = `https://docs.google.com/document/d/${id}/export?format=docx`
            const resp = await fetch(exportUrl, { headers: commonHeaders })
            if (resp.ok) {
              const ab = await resp.arrayBuffer()
              const bytes = Buffer.from(ab)
              const displayName = `document-${id}.docx`
              parts.push({ text: `[FUENTE: GOOGLE DOCS] ${s.title} (${displayName})` })
              try {
                const result = await mammoth.extractRawText({ buffer: bytes } as any)
                const raw = (result?.value || "").trim()
                if (raw) {
                  parts.push({ text: `[EXTRAÍDO DE DOCX (DRIVE) ${displayName}]\n${raw.slice(0, 15000)}` })
                }
              } catch {}
            } else {
              console.error("Drive Docs export failed:", resp.status)
            }
          } else if (kind === "file") {
            // Descarga robusta (directo o confirm) + detección por contenido
            const { bytes, contentType, disposition } = await fetchDriveFileBytes(id)

            let displayName = safeDispositionName(disposition, "")
            if (!displayName) {
              const ext =
                contentType.includes("pdf") ? ".pdf"
                : contentType.includes("officedocument.wordprocessingml.document") ? ".docx"
                : ""
              displayName = `drive-file-${id}${ext}`
            }

            // Detección sólida de PDF aunque el content-type sea engañoso
            const contentTypeLower = (contentType || "").toLowerCase()
            const isPdf =
              contentTypeLower.includes("pdf") ||
              displayName.toLowerCase().endsWith(".pdf") ||
              looksLikePdf(bytes)

            parts.push({ text: `[FUENTE: DRIVE FILE] ${s.title} (${displayName})` })

            if (isPdf) {
              const pdfBlob = new Blob([bytes], { type: "application/pdf" })
              const uploadedPdf = await ai.files.upload({
                file: pdfBlob,
                config: { mimeType: "application/pdf", displayName },
              })
              await waitForFileActive(ai, uploadedPdf, displayName)
              parts.push({ fileData: { fileUri: uploadedPdf.uri, mimeType: "application/pdf" } })
            } else if (
              contentTypeLower.includes("officedocument.wordprocessingml.document") ||
              displayName.toLowerCase().endsWith(".docx")
            ) {
              try {
                const result = await mammoth.extractRawText({ buffer: bytes } as any)
                const raw = (result?.value || "").trim()
                if (raw) {
                  parts.push({ text: `[EXTRAÍDO DE DOCX (DRIVE) ${displayName}]\n${raw.slice(0, 15000)}` })
                } else {
                  parts.push({ text: `[AVISO] El DOCX ${displayName} no tiene texto extraíble.` })
                }
              } catch (e) {
                console.error("mammoth drive failed:", e)
              }
            } else {
              parts.push({
                text: `[AVISO] El archivo de Drive (${displayName}) no es PDF ni DOCX público.`
              })
            }
          }
        }
      } catch (err) {
        console.error("Drive handling failed:", err)
      }

    } else if (isPdfHttpUrl(s.url)) {
      try {
        const u = new URL(s.url)
        const headers: Record<string, string> = {
          "user-agent": "Mozilla/5.0",
          "accept": "application/pdf,application/octet-stream,*/*",
          "referer": `${u.protocol}//${u.host}/`,
        }
        if (u.hostname.endsWith("eric.ed.gov")) {
          headers["referer"] = "https://eric.ed.gov/"
        }

        const resp = await fetch(s.url, { headers })
        if (!resp.ok) {
          console.error("Fetch .pdf link HTTP error:", resp.status, s.url)
        } else {
          const ab = await resp.arrayBuffer()
          const bytes = Buffer.from(ab)

          let displayName = ""
          try {
            const cd = resp.headers.get("content-disposition") || ""
            displayName = safeDispositionName(cd, "")
          } catch {}
          if (!displayName) {
            const last = u.pathname.split("/").pop() || ""
            displayName = decodeURIComponent(last || `${s.title.replace(/[^\w.-]+/g, "_")}.pdf`)
            if (!displayName.toLowerCase().endsWith(".pdf")) displayName += ".pdf"
          }

          const pdfBlob = new Blob([bytes], { type: "application/pdf" })
          const uploadedPdf = await ai.files.upload({
            file: pdfBlob,
            config: { mimeType: "application/pdf", displayName },
          })
          await waitForFileActive(ai, uploadedPdf, displayName)

          // Fuente para el prompt: fileData + una etiqueta textual
          parts.push({ fileData: { fileUri: uploadedPdf.uri, mimeType: "application/pdf" } })
          parts.push({ text: `[FUENTE: PDF LINK] ${s.title} (${displayName})` })

        }
      } catch (err) {
        console.error("Fetch .pdf link failed:", err)
      }
    } else if (s.textFallback && s.textFallback.trim()) {
      parts.push({ text: `[TEXTO] ${s.title}\n\n${s.textFallback}` })
    }
  }

  return { parts, label }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sections = (body?.sections ?? []) as SectionIn[]
    const numQuestions = Number(body?.numQuestions ?? 8)
    const lang = (body?.lang ?? "es") as "es" | "en"
    const perSourceMin = Number(body?.perSourceMin ?? 5)

    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json({ error: "No hay secciones fuente" }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

    const allQuestions: any[] = []

    for (const s of sections as SectionIn[]) {
      const { parts, label } = await preparePartsForSection(ai, s, lang)

      const textChars = countTextChars(parts)
      const hasFileRef = parts.some((p: any) => (p as any).fileData)
      if (!hasFileRef && textChars < 120) {
        console.warn(`Fuente "${label}" salteada por falta de texto (chars=${textChars})`)
        continue
      }

      // Si esta fuente no tiene nada legible, la salteamos
      if (!parts.length) continue

      // cuántas múltiples queremos por fuente
      const multiCount = Math.min(2, perSourceMin)
      const singleItem = {
        type: "object",
        properties: {
          text: { type: "string" },
          type: { const: "SINGLE_CHOICE" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
          sourceRef: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["text", "type", "options", "correctIndex", "sourceRef", "evidence"],
        additionalProperties: false,
      }

      const multiItem = {
        type: "object",
        properties: {
          text: { type: "string" },
          type: { const: "MULTIPLE_CHOICE" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correctIndices: {
            type: "array",
            items: { type: "integer", minimum: 0, maximum: 3 },
            minItems: 2,
            uniqueItems: true,
          },
          sourceRef: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["text", "type", "options", "correctIndices", "sourceRef", "evidence"],
        additionalProperties: false,
      }

      const schemaHint = {
        type: "object",
        properties: {
          questions: {
            type: "array",
            minItems: perSourceMin,
            maxItems: perSourceMin,
            items: { anyOf: [singleItem, multiItem] },
          },
        },
        required: ["questions"],
        additionalProperties: false,
      }

      const sys = lang === "es"
        ? "Sos un generador de exámenes. Usá EXCLUSIVAMENTE ESTA FUENTE (arriba) para crear las preguntas. No inventes nada que no esté en esta fuente."
        : "You are an exam generator. Use ONLY THIS SINGLE SOURCE (above) to write the questions. Do not invent anything not in this source."

      const task = lang === "es"
        ? `Generá EXACTAMENTE ${perSourceMin} preguntas de opción múltiple **solo con esta fuente**.
      - De esas ${perSourceMin}, EXACTAMENTE ${multiCount} deben ser de tipo "MULTIPLE_CHOICE" (más de 1 correcta, usar 'correctIndices').
      - El resto deben ser "SINGLE_CHOICE" (una sola correcta, usar 'correctIndex').
      - Siempre 4 opciones por pregunta.
      - Mezclá niveles (básico–avanzado).
      - Para cada pregunta, incluí 'type', 'sourceRef' (usá: ${label} y página/tiempo si aplica) y 'evidence' (cita/descripcion breve).
      - Si la fuente no alcanza, devolvé estrictamente {"questions": []}.
      - Devolvé SOLO JSON que cumpla: ${JSON.stringify(schemaHint)}`
        : `Generate EXACTLY ${perSourceMin} questions from THIS SINGLE SOURCE ONLY.
      - Of those ${perSourceMin}, EXACTLY ${multiCount} must be "MULTIPLE_CHOICE" (more than one correct, use 'correctIndices').
      - The rest must be "SINGLE_CHOICE" (one correct, use 'correctIndex').
      - Always 4 options per question.
      - Mix difficulty.
      - For each question, include 'type', 'sourceRef' (${label} + page/time if applicable) and 'evidence'.
      - If insufficient material, return {"questions": []} only.
      - Return JSON ONLY matching: ${JSON.stringify(schemaHint)}`

      const resp = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: [parts, { text: sys }, { text: task }].flat(),
        config: { responseMimeType: "application/json" },
      })

      const raw = resp.text || "{}"
      let parsed: any
      try { parsed = JSON.parse(raw) } catch { parsed = { questions: [] } }

      if (Array.isArray(parsed?.questions)) allQuestions.push(...parsed.questions)
    }

    // devolvemos todo junto
    return NextResponse.json({ questions: allQuestions })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? "Error inesperado" }, { status: 500 })
  }
}