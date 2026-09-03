import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      if (event.request.url) event.request.url = event.request.url.split("?")[0];
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;