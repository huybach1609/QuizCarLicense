import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Bỏ qua các file tĩnh, ảnh và api routes
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
