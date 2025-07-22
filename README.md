# Compiled Conversations

A podcast featuring conversations with the people shaping software and technology.

## About

Compiled Conversations is a podcast that features in-depth conversations with the people shaping software and technology.
Each episode explores real-world experiences, technical challenges, and the thinking behind the tools, systems, and decisions that drive modern development.
From engineering practices to architectural choices, this is a show for developers who care about how software is built - and who's building it.

## Development

### Running Hugo Locally

To run the Hugo site locally for development:

1. **Start the development server**:

   ```bash
   hugo server
   ```

2. **View the site** at `http://localhost:1313`

The development server will automatically reload when you make changes to your content or templates.

**Note:** Make sure you have the required dependencies installed for Tailwind CSS:

```bash
npm install
```

### Update Podcast Metadata

The `update-podcast-metadata` script automatically processes podcast episodes and updates their metadata. It:

- Reads episode markdown files from `content/episodes/`
- Finds corresponding audio files in the `podcasts/` directory
- Extracts audio duration, file size, and generates MD5 hash
- Updates episode frontmatter with this metadata
- Embeds podcast metadata (title, artist, album, etc.) into audio files using ID3 tags
- Uses album art from `static/album-art.jpg`

**Note:** The `podcasts/` directory containing audio files is not committed to this repository.

To run the script:

```bash
npm run update-podcast-metadata
```

## Acknowledgments

The design of this podcast website was inspired by Adam Wathan's [Full Stack Radio](https://fullstackradio.com/) podcast.
