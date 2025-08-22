// import Paragraph from '@editorjs/paragraph'
import Embed from '@editorjs/embed';
// import Table from '@editorjs/table'
import List from '@editorjs/list';
// import Warning from '@editorjs/warning'
// import Code from '@editorjs/code'
import Code from '@eonasdan/editorjs-code';
// import LinkTool from '@editorjs/link';
import Image from '@editorjs/image';
// import Raw from '@editorjs/raw'
import Header from '@editorjs/header';
import Quote from '@editorjs/quote';
// import Marker from '@editorjs/marker'
// import CheckList from '@editorjs/checklist'
import Delimiter from '@editorjs/delimiter';
import type { ToolConstructable, ToolSettings } from '@editorjs/editorjs';
import DonationPaywallTool from './paywall';
// import InlineCode from '@editorjs/inline-code'
// import SimpleImage from '@editorjs/simple-image'

export const editorjsTools: Record<string, ToolConstructable | ToolSettings> = {
	embed: Embed,
	// table: Table,
	// marker: Marker,
	list: List,
	// warning: Warning,
	code: Code,
	// linkTool: LinkTool,
	image: {
		class: Image,
		config: {
			endpoints: {
				byFile: '/api/media?remote=false',
				byUrl: '/api/media?remote=true'
			},
			types: 'image/*, video/*'
		}
	},
	// raw: Raw,
	header: Header,
	quote: Quote,
	// checklist: CheckList,
	delimiter: Delimiter,
	// inlineCode: InlineCode,
	// simpleImage: SimpleImage,
	// paragrapgh: Paragraph,
	paywall: DonationPaywallTool
};
