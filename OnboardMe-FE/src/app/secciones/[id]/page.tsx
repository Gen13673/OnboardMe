'use client';

import { useEffect, useState, useRef } from "react";
import { useParams } from 'next/navigation';
import { getSectionContent } from '@/app/services/section.service';
import { SectionContent } from '@/app/models/SectionContent';

function DocxInlineViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("No pude descargar el .docx");
        const buf = await res.arrayBuffer();

        const { renderAsync } = await import("docx-preview");
        if (cancelled || !containerRef.current) return;

        // Limpio antes de renderizar
        containerRef.current.innerHTML = "";

        await renderAsync(buf, containerRef.current, undefined, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
        });
      } catch (e) {
        console.error(e);
        setError("No se pudo previsualizar este .docx");
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div>
        <p className="mb-2 text-gray-700">
          No pude previsualizar el documento. Podés descargarlo:
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Descargar documento
        </a>
      </div>
    );
  }

  // Contenedor con fondo blanco y padding para que se vea “como página”
  return (
    <div className="bg-white p-4 rounded-md shadow">
      <div ref={containerRef} className="docx-wrapper" />
    </div>
  );
}

const isLikelyLocal = (u?: string) => {
  if (!u) return false
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const url = new URL(u, base)
    const h = url.hostname

    // Local explícito
    if (['localhost', '127.0.0.1', '::1'].includes(h)) return true

    // IP privada
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
      const [a, b] = h.split('.').map(Number)
      if (a === 10) return true
      if (a === 192 && b === 168) return true
      if (a === 172 && b >= 16 && b <= 31) return true
    }

    // Misma-origen (ej. tu Next en dev)
    if (typeof window !== 'undefined' && url.origin === window.location.origin) return true

    return false
  } catch {
    return false
  }
}

const isGoogleDriveLike = (u?: string) => {
  if (!u) return false
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const url = new URL(u, base)
    return /(?:^|\.)drive\.google\.com$|(?:^|\.)docs\.google\.com$/.test(url.hostname)
  } catch {
    return false
  }
}

const toDrivePreview = (u: string) => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const url = new URL(u, base)
  const host = url.hostname
  const path = url.pathname
  const idQP = url.searchParams.get('id')

  // docs.google.com/document/d/<ID>/...
  if (/docs\.google\.com$/.test(host)) {
    const m = path.match(/^\/document\/d\/([^/]+)/)
    if (m) return `https://docs.google.com/document/d/${m[1]}/preview`
  }

  // drive.google.com/file/d/<ID>/view...
  if (/drive\.google\.com$/.test(host)) {
    const m = path.match(/^\/file\/d\/([^/]+)/)
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
    // drive.google.com/open?id=<ID>
    if (path === '/open' && idQP) return `https://drive.google.com/file/d/${idQP}/preview`
    // drive.google.com/uc?id=<ID>&export=download
    if (path.startsWith('/uc') && idQP) return `https://drive.google.com/file/d/${idQP}/preview`
  }

  // si no matchea, devolvémosla como vino
  return u
}

export default function SectionContentPage() {
  const { id } = useParams();
  const [content, setContent] = useState<SectionContent | null>(null);

  useEffect(() => {
    if (id) {
      getSectionContent(Number(id))
        .then(setContent)
        .catch(console.error);
    }
  }, [id]);

  if (!content) return <p className="p-6">Cargando contenido...</p>;

  function getYouTubeEmbedUrl(url: string): string {
    const match = url.match(/v=([^&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  const renderContent = () => {
    switch (content.type) {
      case 'VIDEO': {
        const url = content.url?.startsWith("http")
          ? content.url
          : `http://localhost:8080${content.url}`;
        return (
          <iframe
            src={getYouTubeEmbedUrl(url)}
            className="w-full aspect-video"
            allowFullScreen
          />
        );
      }

      case 'DOCUMENT': {
        // 1) Construir URL absoluta sin hardcodear puertos
        let embedUrl = content.url || ''
        if (!embedUrl.startsWith('http')) {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
          embedUrl = new URL(embedUrl, origin).href
        }

        // Si es Drive/Docs, forzamos /preview y NO usamos sandbox
        if (isGoogleDriveLike(embedUrl)) {
          const preview = toDrivePreview(embedUrl)
          return (
            <iframe
              src={preview}
              className="w-full h-[600px]"
              allow="autoplay; fullscreen"
            />
          )
        }

        // 2) Detectar tipo con la URL ya absoluta
        const isDocx  = embedUrl?.toLowerCase().endsWith('.docx') ?? false
        const isPdf   = embedUrl?.toLowerCase().endsWith('.pdf') ?? false
        const isDrive = embedUrl?.includes('drive.google.com') ?? false

        // 3) DOCX
        if (isDocx) {
          // 3.a) Google Drive -> /preview
          if (isDrive) {
            const gdrivePreview = embedUrl.replace('/view', '/preview')
            return (
              <iframe
                src={gdrivePreview}
                className="w-full h-[600px]"
                allow="autoplay"
                sandbox="allow-scripts allow-same-origin"
              />
            )
          }

          // 3.b) Local / misma-origen / IP privada -> Mammoth (render en cliente)
          if (isLikelyLocal(embedUrl)) {
            return <DocxInlineViewer url={embedUrl} />
          }

          // 3.c) Público -> Office Viewer
          const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(embedUrl)}`
          return (
            <iframe
              src={officeUrl}
              className="w-full h-[600px]"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
            />
          )
        }

        // 4) PDF directo
        if (isPdf) {
          return (
            <iframe
              src={encodeURI(embedUrl)}
              className="w-full h-[600px]"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
            />
          )
        }

        // 5) Resto de tipos por iframe directo
        return (
          <iframe
            src={embedUrl}
            className="w-full h-[600px]"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin"
          />
        )
      }

      case 'IMAGE': {
        const url = content.url?.startsWith("http")
          ? content.url
          : `http://localhost:8080${content.url}`;
        return (
          <img src={url} alt="Imagen" className="w-full max-w-2xl mx-auto" />
        );
      }

      case 'EXAM':
        return (
          <p className="text-xl font-medium">Pregunta: {content.question}</p>
        );

      default:
        return <p>Tipo de contenido desconocido</p>;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Contenido de la sección</h1>
      {renderContent()}
    </div>
  );
}