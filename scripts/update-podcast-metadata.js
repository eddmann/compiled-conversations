#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mm = require('music-metadata');
const yaml = require('js-yaml');
const NodeID3 = require('node-id3');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const PODCASTS_DIR = './podcasts';
const EPISODES_DIR = './content/episodes';
const ALBUM_ART_PATH = './static/album-art.jpg';

function getHugoConfig() {
  const hugoConfig = fs.readFileSync('./hugo.yaml', 'utf8');
  return yaml.load(hugoConfig);
}

function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

async function getAudioDuration(filePath) {
  try {
    const metadata = await mm.parseFile(filePath);
    return Math.round(metadata.format.duration);
  } catch (error) {
    console.error(`Error getting duration for ${filePath}:`, error.message);
    return null;
  }
}

function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error(`No frontmatter found in ${filePath}`);
  }

  try {
    return yaml.load(frontmatterMatch[1]);
  } catch (error) {
    throw new Error(
      `Error parsing frontmatter in ${filePath}: ${error.message}`
    );
  }
}

function updateFrontmatter(filePath, newFrontmatter) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error(`No frontmatter found in ${filePath}`);
  }

  const newYaml = yaml.dump(newFrontmatter, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });

  const newContent = content.replace(
    /^---\n[\s\S]*?\n---/,
    `---\n${newYaml}---`
  );

  fs.writeFileSync(filePath, newContent);
}

async function updateAudioMetadata(audioPath, episodeData, episodeFile) {
  try {
    const hugoConfig = getHugoConfig();

    const episodeNumber = path.basename(episodeFile, '.md');
    const formattedDate = new Date(episodeData.date)
      .toISOString()
      .split('T')[0];

    const tags = {
      title: `${episodeNumber}: ${episodeData.title}`,
      artist: hugoConfig.params.author,
      album: hugoConfig.title,
      date: formattedDate,
      trackNumber: episodeNumber,
      genre: 'Podcast',
      comment: {
        language: 'eng',
        text: episodeData.description,
      },
      copyright: `(c) ${new Date(episodeData.date).getFullYear()} ${
        hugoConfig.params.author
      }`,
      APIC: ALBUM_ART_PATH,
    };

    NodeID3.write(tags, audioPath);
    console.log(
      `${colors.green}✓${colors.reset} Updated audio metadata: ${path.basename(
        audioPath
      )}`
    );
  } catch (error) {
    console.error(
      `${colors.red}✗${colors.reset} Error updating audio metadata for ${audioPath}:`,
      error.message
    );
  }
}

function findAudioFile(episodeFile) {
  const episodePath = path.join(EPISODES_DIR, episodeFile);

  try {
    const frontmatter = parseFrontmatter(episodePath);
    const audioFileName = frontmatter.file;

    if (!audioFileName) {
      console.warn(
        `${colors.yellow}⚠${colors.reset} No 'file' field found in frontmatter for: ${episodeFile}`
      );
      return null;
    }

    const audioPath = path.join(PODCASTS_DIR, audioFileName);

    if (fs.existsSync(audioPath)) {
      return audioPath;
    } else {
      console.warn(
        `${colors.yellow}⚠${colors.reset} Audio file not found: ${audioPath}`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `${colors.red}✗${colors.reset} Error parsing frontmatter for ${episodeFile}:`,
      error.message
    );
    return null;
  }
}

async function processEpisode(episodeFile) {
  const episodePath = path.join(EPISODES_DIR, episodeFile);
  const audioPath = findAudioFile(episodeFile);

  if (!audioPath) {
    console.warn(
      `${colors.yellow}⚠${colors.reset} No audio file found for episode: ${episodeFile}`
    );
    return;
  }

  console.log(
    `${colors.blue}→${colors.reset} Processing episode: ${episodeFile}`
  );

  try {
    const frontmatter = parseFrontmatter(episodePath);

    await updateAudioMetadata(audioPath, frontmatter, episodeFile);

    const fileSize = getFileSize(audioPath);
    const duration = await getAudioDuration(audioPath);
    const hash = getFileHash(audioPath);

    const updatedFrontmatter = {
      ...frontmatter,
      size: fileSize,
      duration: duration,
      hash: hash,
    };

    updateFrontmatter(episodePath, updatedFrontmatter);
    console.log(
      `${colors.green}✓${colors.reset} Updated frontmatter for: ${episodeFile}`
    );
  } catch (error) {
    console.error(
      `${colors.red}✗${colors.reset} Error processing episode ${episodeFile}:`,
      error.message
    );
  }
}

async function main() {
  console.log(
    `${colors.blue}🚀${colors.reset} Starting podcast metadata update...`
  );

  if (!fs.existsSync(EPISODES_DIR)) {
    console.error(
      `${colors.red}✗${colors.reset} Episodes directory not found: ${EPISODES_DIR}`
    );
    process.exit(1);
  }

  const episodeFiles = fs
    .readdirSync(EPISODES_DIR)
    .filter(file => file.endsWith('.md'))
    .sort();

  if (episodeFiles.length === 0) {
    console.log(`${colors.yellow}⚠${colors.reset} No episode files found.`);
    return;
  }

  console.log(
    `${colors.blue}📁${colors.reset} Found ${episodeFiles.length} episode(s) to process.`
  );

  for (const episodeFile of episodeFiles) {
    await processEpisode(episodeFile);
  }

  console.log(
    `${colors.green}🎉${colors.reset} Podcast metadata update completed!`
  );
}

main().catch(error => {
  console.error(`${colors.red}💥${colors.reset} Script failed:`, error);
  process.exit(1);
});
