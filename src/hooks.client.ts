import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_APP_ENV } from '$env/static/public';

Sentry.init({
	dsn: 'https://55b7a05d2ac1aabfae3d3063781d1949@sentry.hloth.dev/2',

	tracesSampleRate: 1.0,

	// enabled: PUBLIC_APP_ENV !== 'development',

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: PUBLIC_APP_ENV === 'development' ? 1.0 : 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	integrations: [
		replayIntegration({
			maskAllText: false,
			blockAllMedia: false,
			maskAllInputs: false,
			mask: ['input[type="password"]']
		})
	],

	environment: PUBLIC_APP_ENV,

	sendDefaultPii: true
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
