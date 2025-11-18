import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("authData");
  const { pathname } = request.nextUrl;

  // ✅ Páginas públicas (accesibles sin autenticación)
  const publicPaths = ["/", "/resetPassword"];

  // Si el usuario está logueado e intenta acceder al login o reset, lo redirigimos al landing
  if (authCookie && publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  // Si no está logueado y la ruta no es pública, redirigimos al login
  if (!authCookie && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
