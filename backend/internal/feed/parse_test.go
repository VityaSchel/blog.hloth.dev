package feed

import (
	"slices"
	"strings"
	"testing"
)

const fixture = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0">` +
	`<channel><title>hloth blog drafts</title><description>Decoy</description><link>https://blog.example/drafts/</link>` +
	`<item><title>hloth blog</title><description>Unpublished</description><post-id>decoy-draft</post-id>` +
	`<enclosure url="https://blog.example/_astro/draft.webp" length="0" type="image/avif"/></item></channel>` +
	`<channel><title>hloth blog</title><description>Notes about gardening, by a fictional author 😘</description><link>https://blog.example/</link>` +
	`<item><title>The quest to grow &quot;square&quot; tomatoes &amp; other &lt;odd&gt; shapes</title>` +
	`<link>https://blog.example/square-tomatoes/</link><guid isPermaLink="true">https://blog.example/square-tomatoes/</guid>` +
	`<description>It&apos;s harder than it looks &#x1F345; &#8212; a 7-hour challenge.</description>` +
	`<pubDate>Wed, 18 Feb 2026 05:00:00 GMT</pubDate><post-id>square-tomatoes</post-id><category>tutorial</category>` +
	`<author>Jane Doe / Gardener &lt;jane@blog.example&gt; (https://blog.example/)</author>` +
	`<enclosure url="https://blog.example/_image?href=%2Fbanner.jpg&amp;w=1625&amp;h=1000" length="0" type="image/avif"/></item>` +
	`<item><title><![CDATA[Compost <b>basics</b> & myths]]></title>` +
	`<link>https://blog.example/compost-basics/</link><guid isPermaLink="true">https://blog.example/compost-basics/</guid>` +
	`<description><![CDATA[Raw <i>markup</i> & ampersands stay as written.]]></description>` +
	`<pubDate>Tue, 30 Dec 2025 23:00:00 GMT</pubDate><post-id>compost-basics</post-id><category>life_story</category>` +
	`<enclosure url="https://blog.example/_astro/compost.Ab12Cd34_Z1x2Y3.webp" length="0" type="image/avif"/></item>` +
	`<item><title>Untracked item</title><description>No post id, cannot be addressed</description>` +
	`<enclosure url="https://blog.example/_astro/untracked.webp" length="0" type="image/avif"/></item>` +
	`<item><title>Winter pruning</title><link>https://blog.example/winter-pruning/</link>` +
	`<description>Cut less than you think.</description><pubDate>Sat, 01 Nov 2025 10:00:00 GMT</pubDate>` +
	`<post-id>winter-pruning</post-id><category>tutorial</category></item>` +
	`<item><title>Привет, сад</title><link>https://blog.example/first-post/</link>` +
	`<description></description><pubDate>Thu, 23 Oct 2025 09:00:00 GMT</pubDate><post-id>first-post</post-id>` +
	`<enclosure url="https://blog.example/_astro/first.Qw98Er76_1aB2c.webp" length="0" type="image/avif"/></item>` +
	`</channel>` +
	`<channel><title>other</title><item><title>Elsewhere</title><post-id>decoy-other</post-id></item></channel>` +
	`</rss>`

var fixturePosts = []Post{
	{
		ID:       "first-post",
		Title:    "Привет, сад",
		ImageURL: "https://blog.example/_astro/first.Qw98Er76_1aB2c.webp",
	},
	{
		ID:          "winter-pruning",
		Title:       "Winter pruning",
		Description: "Cut less than you think.",
	},
	{
		ID:          "compost-basics",
		Title:       "Compost <b>basics</b> & myths",
		Description: "Raw <i>markup</i> & ampersands stay as written.",
		ImageURL:    "https://blog.example/_astro/compost.Ab12Cd34_Z1x2Y3.webp",
	},
	{
		ID:          "square-tomatoes",
		Title:       `The quest to grow "square" tomatoes & other <odd> shapes`,
		Description: "It's harder than it looks 🍅 — a 7-hour challenge.",
		ImageURL:    "https://blog.example/_image?href=%2Fbanner.jpg&w=1625&h=1000",
	},
}

func TestParse(t *testing.T) {
	posts, err := parse(strings.NewReader(fixture))
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(posts, fixturePosts) {
		t.Fatalf("posts:\n got %+v\nwant %+v", posts, fixturePosts)
	}
}

func TestParseEmptyChannel(t *testing.T) {
	posts, err := parse(strings.NewReader(`<rss version="2.0"><channel><title>hloth blog</title></channel></rss>`))
	if err != nil {
		t.Fatal(err)
	}
	if len(posts) != 0 {
		t.Fatalf("got %+v, want no posts", posts)
	}
}

func TestParseRejects(t *testing.T) {
	item := `<item><title>hloth blog</title><post-id>a</post-id></item>`
	tests := map[string]string{
		"empty":                   ``,
		"not xml":                 `{"posts":[]}`,
		"html error page":         `<!doctype html><html><head><title>hloth blog</title></head><body>Bad Gateway</body></html>`,
		"other root":              `<feed><channel><title>hloth blog</title>` + item + `</channel></feed>`,
		"truncated":               fixture[:len(fixture)-len(`</channel></rss>`)],
		"no channel":              `<rss version="2.0"></rss>`,
		"wrong channel title":     strings.Replace(fixture, `<channel><title>hloth blog</title>`, `<channel><title>Hloth Blog</title>`, 1),
		"untitled channel":        `<rss version="2.0"><channel>` + item + `</channel></rss>`,
		"title only on its items": `<rss version="2.0"><channel><title>someone else</title>` + item + `</channel></rss>`,
		"channel outside of rss":  `<rss version="2.0"><wrapper><channel><title>hloth blog</title>` + item + `</channel></wrapper></rss>`,
	}
	for name, input := range tests {
		t.Run(name, func(t *testing.T) {
			if posts, err := parse(strings.NewReader(input)); err == nil {
				t.Fatalf("accepted, got %+v", posts)
			}
		})
	}
}
