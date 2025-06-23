import { getArtworkStream } from "@gridfire/api/controllers/artworkController";
import { streamFromBucket } from "@gridfire/api/controllers/storage";
import Logger from "@gridfire/shared/logger";
import archiver from "archiver";
import { Response } from "express";
import assert from "node:assert/strict";

const { BUCKET_FLAC, BUCKET_MP3 } = process.env;
const logger = new Logger("archiveController");

assert(BUCKET_FLAC, "BUCKET_FLAC env var not set.");
assert(BUCKET_MP3, "BUCKET_MP3 env var not set.");

interface Buckets {
  flac: string;
  mp3: string;
}

const buckets: Buckets = { flac: BUCKET_FLAC, mp3: BUCKET_MP3 };

interface ZipStream {
  isEdition: boolean;
  release: any;
  res: Response;
  format: string;
}

const zipDownload = async ({ isEdition, release, res, format }: ZipStream) => {
  try {
    const { _id, artistName, releaseTitle, trackList } = release;
    const releaseId = _id.toString();
    const archive = archiver("zip");
    archive.on("end", () => logger.info(`Download archiving complete for release ${releaseId}.`));
    archive.on("error", error => logger.error("Archiver error:", error));
    archive.on("warning", error => logger.warn("Archiver warning:", error));
    res.attachment(`${artistName} - ${releaseTitle}.zip`);
    archive.pipe(res);
    const artworkStream = await getArtworkStream(releaseId.toString());

    if (!artworkStream) {
      throw new Error(`No artwork found for release ${releaseId}.`);
    }

    archive.append(artworkStream, { name: `${artistName} - ${releaseTitle}.jpg` });

    for (const { _id, isEditionOnly, position, trackTitle } of trackList) {
      if (!isEdition && isEditionOnly) continue;
      const trackId = _id.toString();
      const trackName = `${position.toString(10).padStart(2, "0")} ${trackTitle}.${format}`;
      const trackStream = await streamFromBucket(buckets[format as keyof Buckets], `${releaseId}/${trackId}`);

      if (!trackStream) {
        throw new Error(`No track stream found for release ${releaseId}.`);
      }

      archive.append(trackStream, { name: trackName });
    }

    archive.finalize();
  } catch (error) {
    logger.error(error);
  }
};

export { zipDownload };
