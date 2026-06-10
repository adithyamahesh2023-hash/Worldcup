import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
  const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard')
  const isLeaderboardRoute = req.nextUrl.pathname.startsWith('/leaderboard')
  const isMatchRoute = req.nextUrl.pathname.startsWith('/matches')

  if (isAdminRoute && !isLoggedIn) {
    return Response.redirect(new URL('/auth/signin', req.nextUrl))
  }
  if (isAdminRoute && req.auth?.user?.role !== 'ADMIN') {
    return Response.redirect(new URL('/dashboard', req.nextUrl))
  }
  if ((isDashboardRoute || isLeaderboardRoute || isMatchRoute || req.nextUrl.pathname.startsWith('/profile')) && !isLoggedIn) {
    return Response.redirect(new URL('/auth/signin', req.nextUrl))
  }
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', req.nextUrl))
  }
})

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/leaderboard/:path*', '/matches/:path*', '/profile', '/profile/:path*', '/auth/:path*'],
}