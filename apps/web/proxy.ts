import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// IMPORTANT: must match ALL routes where you call auth() / currentUser() etc.
export const config = {
    matcher: [
        // everything except next internals and static files
        "/((?!_next|.*\\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|txt|xml|json)).*)",
        // always include api routes
        "/api/:path*",
    ],
};
