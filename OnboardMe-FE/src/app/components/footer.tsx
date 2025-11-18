"use client";

import ChatWidget from "./ChatWidget";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full flex justify-end items-center px-6 py-4 bg-transparent pointer-events-none z-50">
      {/* El pointer-events-none evita bloquear clics sobre el contenido, 
          y el widget internamente maneja su propia interacción */}
      <div className="pointer-events-auto">
        <ChatWidget />
      </div>
    </footer>
  );
}
