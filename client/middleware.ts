import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isMemberRoute = createRouteMatcher(['/dashboard(.*)'])

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/contact-us",
  "/about-us",
  '/api/auth/new-user',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Protect all routes starting with `/admin`
  if (isAdminRoute(request) && (await auth()).sessionClaims?.metadata?.role !== 'ADMIN') {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
  }

  // Protect all routes starting with `/dashboard`
  if (isMemberRoute(request) && (await auth()).sessionClaims?.metadata?.role !== 'MEMBER') {
    const url = new URL('/admin', request.url)
    return NextResponse.redirect(url)
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
