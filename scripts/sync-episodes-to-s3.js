#!/usr/bin/env node

const {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');
const { createReadStream } = require('fs');
const { stat, readdir } = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const EPISODE_DIR = path.join(__dirname, '..', 'podcasts');

const args = process.argv.slice(2);

function parseArguments() {
  const bucketIndex = args.findIndex(arg => arg === '--bucket' || arg === '-b');
  if (bucketIndex === -1 || bucketIndex === args.length - 1) {
    console.error(
      '❌ Bucket name is required. Use --bucket or -b to specify the S3 bucket.'
    );
    console.error(
      'Example: node scripts/sync-episodes-to-s3.js --bucket my-podcast-bucket --dry-run'
    );
    process.exit(1);
  }

  return {
    bucketName: args[bucketIndex + 1],
    isDryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

const { bucketName, isDryRun, verbose } = parseArguments();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
});

async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = createReadStream(filePath);

    stream.on('data', data => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', error => {
      reject(error);
    });
  });
}

async function getFileStats(filePath) {
  const stats = await stat(filePath);
  return {
    size: stats.size,
    mtime: stats.mtime,
    hash: await calculateFileHash(filePath),
  };
}

async function getS3ObjectMetadata(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    return {
      exists: true,
      etag: response.ETag?.replace(/"/g, ''),
      size: response.ContentLength,
      lastModified: response.LastModified,
    };
  } catch (error) {
    if (error.name === 'NotFound') {
      return { exists: false };
    }
    throw error;
  }
}

async function uploadToS3(filePath, key) {
  const fileStream = createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileStream,
    ContentType: 'audio/mpeg',
  });

  return await s3Client.send(command);
}

async function getLocalFiles() {
  const files = await readdir(EPISODE_DIR);
  return files.filter(file => file.endsWith('.mp3'));
}

async function syncEpisodes() {
  console.log(`🎙️  Episode Sync Tool`);
  console.log(`Bucket: ${bucketName}`);
  console.log(`Local directory: ${EPISODE_DIR}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('─'.repeat(50));

  try {
    const localFiles = await getLocalFiles();

    if (localFiles.length === 0) {
      console.log('❌ No MP3 files found in episodes directory');
      return;
    }

    console.log(`📁 Found ${localFiles.length} local MP3 files:`);
    localFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');

    let uploadCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const fileName of localFiles) {
      const filePath = path.join(EPISODE_DIR, fileName);
      const s3Key = fileName;

      try {
        console.log(`🔍 Checking: ${fileName}`);

        const localStats = await getFileStats(filePath);

        if (verbose) {
          console.log(
            `   Local file size: ${(localStats.size / 1024 / 1024).toFixed(
              2
            )} MB`
          );
          console.log(`   Local file hash: ${localStats.hash}`);
        }

        const s3Info = await getS3ObjectMetadata(s3Key);

        if (!s3Info.exists) {
          console.log(`   📤 NEW FILE - Will upload to S3`);
          uploadCount++;

          if (!isDryRun) {
            console.log(`   ⬆️  Uploading to S3...`);
            await uploadToS3(filePath, s3Key);
            console.log(`   ✅ Upload complete`);
          }
        } else {
          if (localStats.hash === s3Info.etag) {
            console.log(`   ✅ File unchanged - skipping`);
            skipCount++;
          } else {
            console.log(`   📤 FILE CHANGED - Will re-upload to S3`);
            if (verbose) {
              console.log(`   Local hash:  ${localStats.hash}`);
              console.log(`   S3 ETag:    ${s3Info.etag}`);
            }
            uploadCount++;

            if (!isDryRun) {
              console.log(`   ⬆️  Uploading to S3...`);
              await uploadToS3(filePath, s3Key);
              console.log(`   ✅ Upload complete`);
            }
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${fileName}:`, error.message);
        errorCount++;
      }

      console.log('');
    }

    console.log('─'.repeat(50));
    console.log('📊 SYNC SUMMARY:');
    console.log(`   Files to upload: ${uploadCount}`);
    console.log(`   Files skipped: ${skipCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (isDryRun) {
      console.log(
        '\n💡 This was a dry run. Use without --dry-run to actually upload files.'
      );
    } else {
      console.log('\n✅ Sync completed!');
    }
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

function checkAWSCredentials() {
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
    console.error(
      '❌ AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables, or configure AWS CLI.'
    );
    process.exit(1);
  }
}

async function main() {
  checkAWSCredentials();
  await syncEpisodes();
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);
