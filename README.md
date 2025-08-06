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

### Update Episodes Metadata

The `update-episodes-metadata` script automatically processes local episode audio files and updates their metadata. It:

- Reads episode markdown files from `content/episodes/`
- Finds corresponding audio files in the local `episodes/` directory
- Extracts audio duration, file size, and generates MD5 hash
- Updates episode frontmatter with this metadata
- Embeds podcast metadata (title, artist, album, etc.) into audio files using ID3 tags
- Uses album art from `static/album-art.jpg`

**Note:** The local `episodes/` directory containing audio files is not committed to this repository.

To run the script:

```bash
npm run update-episodes-metadata
```

### Sync Episodes to S3

The `sync-episodes` script uploads local episode audio files to a specified S3 bucket. It:

- Reads MP3 files from the local `episodes/` directory
- Compares local file hashes with S3 ETags to detect changes
- Uploads only new or modified files to the specified S3 bucket
- Provides dry-run mode to preview uploads without making changes
- Sets correct `audio/mpeg` content type for podcast files
- Includes verbose logging for detailed upload information

**Note:** The local `episodes/` directory containing audio files is not committed to this repository.

**Prerequisites:** AWS credentials must be configured via environment variables, AWS CLI, or IAM role.

To run the script:

```bash
npm run sync-episodes -- --bucket my-podcast-bucket --dry-run
npm run sync-episodes -- --bucket my-podcast-bucket
```

## Acknowledgments

The design of this podcast website was inspired by Adam Wathan's [Full Stack Radio](https://fullstackradio.com/) podcast.
