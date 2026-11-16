export const SESSION_COOKIE = "alp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 giờ

/** Các route không cần đăng nhập */
export const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register"];
