export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const HOME_PATH = "/communities";
export const CALLBACK_PATH = "/auth/callback";

export function isPublicPath(pathname: string) {
  return (
    pathname === LOGIN_PATH ||
    pathname === SIGNUP_PATH ||
    pathname.startsWith("/auth/")
  );
}

export function safeNextPath(next: string | null | undefined) {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next === LOGIN_PATH ||
    next === SIGNUP_PATH ||
    next.startsWith("/auth/")
  ) {
    return HOME_PATH;
  }
  return next;
}
