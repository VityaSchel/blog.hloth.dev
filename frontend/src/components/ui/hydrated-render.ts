type HydratedRenderProbe = { hydratedIslandRender?: () => boolean };

export const hydratedRender = () =>
	(globalThis as HydratedRenderProbe).hydratedIslandRender?.() ?? false;
