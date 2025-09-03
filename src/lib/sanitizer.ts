import sanitizeHtml from 'xss';

export const sanitize = (html: string) =>
	sanitizeHtml(html, {
		allowList: {
			a: ['href', 'target', 'rel'],
			br: [],
			i: [],
			b: [],
			strong: [],
			em: [],
			strike: [],
			u: []
		},
		allowCommentTag: false,
		css: false
	});

export const sanitizeHighlightedCode = (code: string) =>
	sanitizeHtml(code, {
		allowList: {
			a: ['href', 'target', 'rel'],
			br: [],
			i: [],
			b: [],
			strong: [],
			em: [],
			strike: [],
			u: [],
			span: ['style', 'class'],
			pre: ['style', 'class'],
			code: ['style', 'class']
		},
		allowCommentTag: false,
		css: false
	});
