export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const HOME_PATH = "/communities";
export const CALLBACK_PATH = "/auth/callback";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const FORGOT_PASSWORD_SENT_PATH = "/forgot-password/sent";
export const RESET_PASSWORD_PATH = "/reset-password";

export function isPublicPath(pathname: string) {
  return (
    pathname === LOGIN_PATH ||
    pathname === SIGNUP_PATH ||
    pathname === FORGOT_PASSWORD_PATH ||
    pathname === FORGOT_PASSWORD_SENT_PATH ||
    pathname === RESET_PASSWORD_PATH ||
    pathname.startsWith("/auth/")
  );
}

export function recoveryCallbackUrl(origin: string) {
  const url = new URL(CALLBACK_PATH, origin);
  url.searchParams.set("next", RESET_PASSWORD_PATH);
  return url.toString();
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
