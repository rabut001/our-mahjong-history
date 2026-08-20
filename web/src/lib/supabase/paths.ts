export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const HOME_PATH = "/communities";
export const CALLBACK_PATH = "/auth/callback";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const FORGOT_PASSWORD_SENT_PATH = "/forgot-password/sent";
export const RESET_PASSWORD_PATH = "/reset-password";
export const AUTH_ERROR_PARAM = "auth";
export const OAUTH_FROM_COOKIE = "omh_oauth_from";

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

export function oauthReturnPath(from: string | null | undefined) {
  return from === "signup" ? SIGNUP_PATH : LOGIN_PATH;
}

export function authErrorUrl(
  origin: string,
  key: string,
  from: string | null | undefined,
  next: string,
) {
  const path = oauthReturnPath(from);
  const url = new URL(path, origin);
  url.searchParams.set(AUTH_ERROR_PARAM, key);
  if (path === LOGIN_PATH && next !== HOME_PATH) {
    url.searchParams.set("next", next);
  }
  return url;
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
