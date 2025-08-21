import { getContext, setContext } from 'svelte';

type ThemeContext = {
	theme: 'light' | 'dark' | null;
};

const key = {};

export function setThemeContext(context: ThemeContext) {
	setContext(key, context);
}

export function getThemeContext() {
	return getContext(key) as ThemeContext;
}
