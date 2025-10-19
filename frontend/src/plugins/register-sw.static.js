const registerSW = async () => {
	if ("serviceWorker" in navigator) {
		try {
			const registration = await navigator.serviceWorker.register("/sw.js", {
				scope: "/",
			});
			if (registration.installing) {
				// sw event: installed
			} else if (registration.waiting) {
				// sw event: waiting
			} else if (registration.active) {
				// sw event: active
			}

			// sw event: after registration
		} catch (error) {
			console.error(error);
			// sw event: error
		}
	} else {
		// sw event: not supported
	}
};

registerSW();
