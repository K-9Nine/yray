import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Run middleware on all routes except Next.js internals and static files
        "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|map)$).*)",
        // Always run on API routes
        "/(api|trpc)(.*)",
    ],
};
