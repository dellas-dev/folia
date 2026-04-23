import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/elements(.*)',
  '/mockups(.*)',
  '/gallery(.*)',
  '/affiliate(.*)',
  '/settings(.*)',
])

const isProtectedApiRoute = createRouteMatcher([
  '/api/mockup(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) || isProtectedApiRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
