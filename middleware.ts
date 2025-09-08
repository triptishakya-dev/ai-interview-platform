import { NextRequest, NextResponse } from 'next/server'
import type { NextMiddleware } from 'next/server'

export const middleware: NextMiddleware = (req: NextRequest) => {
  const userAuthToken = req.cookies.get('userAuth')?.value; // Next.js 13+ cookies API

  const { pathname } = req.nextUrl;

  const SignInpage = pathname === '/sign-in';
  const SignUppage = pathname === '/sign-up';
  const uploadResume = pathname === '/upload-resume';
  const resumeDetail = pathname.startsWith('/resume/');

  if (userAuthToken && (SignInpage || SignUppage)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (!userAuthToken && (uploadResume || resumeDetail)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  return NextResponse.next();
};

export default middleware;
