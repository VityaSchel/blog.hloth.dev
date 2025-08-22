import type { ToolConstructable, ToolSettings } from '@editorjs/editorjs';
import Header from '@editorjs/header';
// import LinkTool from '@editorjs/link';
import Delimiter from '@editorjs/delimiter';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
// import Warning from '@editorjs/warning';
import Image from '@editorjs/image';
import Video from '@hloth/editorjs-video';
import Code from '@eonasdan/editorjs-code';
import Embed from '@editorjs/embed';
import DonationPaywallTool from './paywall';

export const editorjsTools: Record<string, ToolConstructable | ToolSettings> = {
	header: Header,
	// paragraph (built-in)
	// linkTool: LinkTool,
	delimiter: Delimiter,
	list: List,
	quote: Quote,
	// warning: Warning,
	image: {
		class: Image,
		config: {
			endpoints: {
				byFile: '/api/media?remote=false&type=image',
				byUrl: '/api/media?remote=true&type=image'
			},
			types: 'image/*'
		}
	},
	video: {
		class: Video,
		config: {
			endpoints: {
				byFile: '/api/media?remote=false&type=video',
				byUrl: '/api/media?remote=true&type=video'
			},
			types: 'video/*'
		}
	},
	code: Code,
	embed: Embed,

	// Custom:
	paywall: DonationPaywallTool
};
