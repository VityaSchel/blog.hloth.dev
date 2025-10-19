<script lang="ts">
	import { API_URL, PUBLIC_WEB_PUSH_KEY } from "astro:env/client";
	import { onMount } from "svelte";

	let subscribed = $state(false);
	let subscription: PushSubscription | null = $state(null);
	let registration: ServiceWorkerRegistration | null = $state(null);
	let loading = $state(false);
	let error: null | string = $state(null);

	onMount(() => {
		if (typeof window !== "undefined" && "serviceWorker" in navigator) {
			navigator.serviceWorker.ready.then((reg) => {
				if ("getSubscription" in reg.pushManager) {
					reg.pushManager.getSubscription().then((sub) => {
						if (
							sub &&
							!(
								sub.expirationTime &&
								Date.now() > sub.expirationTime - 5 * 60 * 1000
							)
						) {
							subscription = sub;
							subscribed = true;
						}
					});
					registration = reg;
				}
			});
		}
	});

	const handleSubscribe = async () => {
		error = null;
		if (registration === null) return;
		loading = true;
		try {
			const sub = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: PUBLIC_WEB_PUSH_KEY,
			});
			const subData = sub.toJSON();
			const response = await fetch(new URL("notifications/web-push", API_URL), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(subData),
			}).then(
				(res) =>
					res.json() as Promise<{ ok: true } | { ok: false; error: string }>,
			);
			if (response.ok) {
				subscription = sub;
				subscribed = true;
			} else {
				throw new Error(response.error);
			}
		} catch (e) {
			console.error(e);
			if (e instanceof Error && e.name === "NotAllowedError") {
				error = "not_allowed";
			} else {
				error = "unknown_subscribe";
			}
		} finally {
			loading = false;
		}
	};

	const handleUnsubscribe = async () => {
		error = null;
		if (registration === null || subscription === null) return;
		loading = true;
		try {
			await subscription.unsubscribe();
			const response = await fetch(
				new URL(`notifications/web-push/${subscription.endpoint}`, API_URL),
				{ method: "DELETE" },
			).then(
				(res) =>
					res.json() as Promise<{ ok: true } | { ok: false; error: string }>,
			);
			if (response.ok) {
				subscription = null;
				subscribed = false;
			} else {
				throw new Error(response.error);
			}
		} catch (e) {
			console.error(e);
			error = "unknown_subscribe";
		} finally {
			loading = false;
		}
	};
</script>

{#if error}
	<div
		class="
			mb-2 rounded-lg bg-red-600 p-2 font-text text-[11px] leading-tight
			font-normal
		"
	>
		{#if error === "not_allowed"}
			Your browser does not allow push-notifications. Try enabling them in the
			browser or site settings.
		{:else if error === "unknown_subscribe"}
			An error occurred while subscribing to push-notifications.
		{:else if error === "unknown_unsubscribe"}
			An error occurred while unsubscribing from push-notifications.
		{/if}
	</div>
{/if}
{#if registration}
	<button
		type="button"
		class="
			flex w-full cursor-pointer items-center justify-between gap-8 text-left
			text-sm font-medium
		"
		onclick={subscribed ? handleUnsubscribe : handleSubscribe}
		disabled={loading}
	>
		<span>Subscribe to push-notifications about new posts</span>
		<div
			class="
				relative flex h-6 w-16 shrink-0 gap-1 rounded-full bg-cream-alt/70 px-2
				py-[4px] tracking-tight
				dark:bg-black-alt
			"
		>
			<span
				class={[
					`
						border-opacity-30 absolute top-1 left-1 flex h-[calc(100%-8px)] w-[40%]
						items-center justify-center rounded-full border border-white/20
						bg-amber-100/30 shadow-md transition-all duration-300
					`,
					{
						"left-[calc(60%-4px)] bg-lime-500/90": subscribed,
					},
				]}
			>
				{#if loading}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="2em"
						height="2em"
						viewBox="0 0 24 24"
					>
						<circle cx="18" cy="12" r="0" fill="currentColor">
							<animate
								attributeName="r"
								begin=".67"
								calcMode="spline"
								dur="1s"
								keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
								repeatCount="indefinite"
								values="0;2;0;0"
							></animate>
						</circle>
						<circle cx="12" cy="12" r="0" fill="currentColor">
							<animate
								attributeName="r"
								begin=".33"
								calcMode="spline"
								dur="1s"
								keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
								repeatCount="indefinite"
								values="0;2;0;0"
							></animate>
						</circle>
						<circle cx="6" cy="12" r="0" fill="currentColor">
							<animate
								attributeName="r"
								begin="0"
								calcMode="spline"
								dur="1.5s"
								keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
								repeatCount="indefinite"
								values="0;2;0;0"
							></animate>
						</circle>
					</svg>
				{/if}
			</span>
		</div>
	</button>
{/if}
