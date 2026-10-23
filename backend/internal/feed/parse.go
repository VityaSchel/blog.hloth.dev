package feed

import (
	"encoding/xml"
	"fmt"
	"io"
	"slices"
)

const channelTitle = "hloth blog"

type Post struct{ ID, Title, Description, ImageURL string }

type document struct {
	XMLName  xml.Name `xml:"rss"`
	Channels []struct {
		Title string `xml:"title"`
		Items []struct {
			ID          string `xml:"post-id"`
			Title       string `xml:"title"`
			Description string `xml:"description"`
			Enclosure   struct {
				URL string `xml:"url,attr"`
			} `xml:"enclosure"`
		} `xml:"item"`
	} `xml:"channel"`
}

func parse(r io.Reader) ([]Post, error) {
	var doc document
	if err := xml.NewDecoder(r).Decode(&doc); err != nil {
		return nil, fmt.Errorf("feed: %w", err)
	}
	for _, channel := range doc.Channels {
		if channel.Title != channelTitle {
			continue
		}
		oldestFirst := make([]Post, 0, len(channel.Items))
		for _, item := range slices.Backward(channel.Items) {
			if item.ID == "" {
				continue
			}
			oldestFirst = append(oldestFirst, Post{
				ID:          item.ID,
				Title:       item.Title,
				Description: item.Description,
				ImageURL:    item.Enclosure.URL,
			})
		}
		return oldestFirst, nil
	}
	return nil, fmt.Errorf("feed: no channel titled %q", channelTitle)
}
