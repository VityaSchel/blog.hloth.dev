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
