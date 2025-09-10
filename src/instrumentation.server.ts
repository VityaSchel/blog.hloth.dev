import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_APP_ENV } from '$env/static/public';

Sentry.init({
	dsn: 'https://55b7a05d2ac1aabfae3d3063781d1949@sentry.hloth.dev/2',

	enabled: PUBLIC_APP_ENV !== 'development',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,

	environment: PUBLIC_APP_ENV
});
