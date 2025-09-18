import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { lookup as lookupMime } from "mime-types"
import mammoth from "mammoth"

export const runtime = "nodejs"

async function waitForFileActive(ai: GoogleGenAI, uploaded: any, displayName: string, timeoutMs = 120000, intervalMs = 2000) {
  const name =
    uploaded?.file?.name ||
    uploaded?.name ||
    (typeof uploaded?.uri === "string" ? uploaded.uri.split("/").pop() : "")
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const f: any = await ai.files.get({ name })
    if (f?.state === "ACTIVE") return f
    if (f?.state === "FAILED") throw new Error(`El archivo ${displayName} falló al procesar en Files API`)
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`El archivo ${displayName} no pasó a ACTIVE dentro del tiempo de espera`)
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Falta 'file'" }, { status: 400 })

    const displayName = file.name || "upload"
    const guessed = (file.type && file.type !== "application/octet-stream")
      ? file.type
      : (lookupMime(displayName) as string) || "application/octet-stream"

    // DOCX: Gemini Files API NO lo soporta -> extraemos texto con mammoth y devolvemos texto.
    if (displayName.toLowerCase().endsWith(".docx") || guessed === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const ab = await file.arrayBuffer()
      const bytes = Buffer.from(ab)
      let text = ""
      try {
        const res = await mammoth.extractRawText({ buffer: bytes } as any)
        text = (res?.value || "").trim()
      } catch {}
      return NextResponse.json({
        kind: "text",
        displayName,
        text,// lo usamos como textFallback
      })
    }

    // Resto de tipos (PDF, imágenes, audio/video, etc.) -> subir directo a Gemini Files API
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
    const uploaded = await ai.files.upload({
      file, // el Web File nativo, se streamea
      config: { mimeType: guessed, displayName },
    })
    const active = await waitForFileActive(ai, uploaded, displayName)

    return NextResponse.json({
      kind: "fileData",
      displayName,
      mimeType: guessed,
      fileUri: active.uri,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error staging file" }, { status: 500 })
  }
}