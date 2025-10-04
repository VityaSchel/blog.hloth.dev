# [hloth blog](https://blog.hloth.dev)

[![Screenshot](./screenshot.webp)](https://blog.hloth.dev)

[Visit the website](https://blog.hloth.dev) · Tor: [blog.hlothdevzkti6suoksy7lcy7hmpxnr3msu5waokzaslsi2mnx5ouu4qd.onion](http://blog.hlothdevzkti6suoksy7lcy7hmpxnr3msu5waokzaslsi2mnx5ouu4qd.onion/)

My personal blog about web development stuff and my IRL stuff. No ads, no JavaScript required, pure shitpost 😻

Old React v18 + Next.js v14 version is available under [react18-nextjs14-2024](https://github.com/VityaSchel/blog.hloth.dev/tree/react18-nextjs14-2024) branch.

## Run

If you'd like to have the one and only perfect blog engine or just peek at admin tools, feel free to install my blog locally and run it:

1. Clone the repository
2. Install dependencies with [Bun](https://bun.sh): `bun install`
3. Deploy PostgreSQL database and fill .env file
4. Run `bun db:push` to push db schema
5. Run with `bun dev`
6. In production run `bun build`, `bun db:migrate` and `PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host ADDRESS_HEADER=x-forwarded-for bun ./build/index.js` (adjust env variables according to Svelte node-adapter [guide](https://svelte.dev/docs/kit/adapter-node))

## Donate

[hloth.dev/donate](https://hloth.dev/donate) · Tor: [hlothdevzkti6suoksy7lcy7hmpxnr3msu5waokzaslsi2mnx5ouu4qd.onion/donate](http://hlothdevzkti6suoksy7lcy7hmpxnr3msu5waokzaslsi2mnx5ouu4qd.onion/donate)

## Acknowledgements

- Design inspired by Milos Bojkovic. [Dribbble project link](https://dribbble.com/shots/21592801-Blog-post-exploration).
- PP Mori font by Pangram Pangram Foundry (free for personal use). [License](./static/pp-mori/license.pdf).
- [Svelte & SvelteKit](https://svelte.dev/) ❤️
- [Drizzle ORM & Drizzle Kit](https://orm.drizzle.team/) 😼
- The one and only forever FLOSSy PostgreSQL and postgres JS driver.
- [Monaco editor](https://microsoft.github.io/monaco-editor) markdown editor — previously I used [editor.js](https://editorjs.io/), then [milkdown.dev](https://milkdown.dev) and then [Carta](https://beartocode.github.io/carta/)
- Thank you to all authors of these projects used in my blog:
  - [cheerio](https://cheerio.js.org/)
  - [dompurify](https://github.com/cure53/DOMPurify)
  - [dotenvx](https://dotenvx.com/)
  - [ESLint](https://eslint.org)
  - [Fontsource](https://fontsource.org/)
  - [hotkeys.js](https://wangchujiang.com/hotkeys-js/)
  - [Husky](https://typicode.github.io/husky/)
  - [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify)
  - [mdast](https://github.com/syntax-tree/mdast)
  - [mediainfo.js](https://mediainfo.js.org/)
  - [monaco-themes](https://github.com/brijeshb42/monaco-themes)
  - [plaiceholder](https://plaiceholder.co/docs)
  - [Prettier](https://prettier.io)
  - [remark](https://github.com/remarkjs/remark)
  - [sharp](https://sharp.pixelplumbing.com/)
  - [super-sitemap](https://github.com/jasongitmail/super-sitemap/)
  - [svelte-sonner](https://svelte-sonner.vercel.app/)
  - [TailwindCSS](https://tailwindcss.com/)
  - [unified](https://github.com/unifiedjs/unified)
  - [unist](https://github.com/syntax-tree/unist)
  - [web-push](https://github.com/web-push-libs/web-push)
  - [zod](https://zod.dev/)
- A special THANK YOU to [Anthony Fu](https://antfu.me/) for fantastic [shiki](https://github.com/shikijs/shiki) code highlighter!

## License

Source code is licensed under [MIT](./LICENSE). Blog materials are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) unless otherwise stated.
