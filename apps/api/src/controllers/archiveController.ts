import { getArtworkStream } from "@gridfire/api/controllers/artworkController";
import { streamFromBucket } from "@gridfire/api/controllers/storage";
import Logger from "@gridfire/shared/logger";
import Edition from "@gridfire/shared/models/Edition";
import archiver from "archiver";
import { Response } from "express";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

const { BUCKET_FLAC, BUCKET_MP3 } = process.env;
assert(BUCKET_FLAC, "BUCKET_FLAC env var not set.");
assert(BUCKET_MP3, "BUCKET_MP3 env var not set.");
const logger = new Logger("archiveController");

interface Buckets {
  flac: string;
  mp3: string;
}

const buckets: Buckets = { flac: BUCKET_FLAC, mp3: BUCKET_MP3 };

interface ZipStream {
  editionId: string | null;
  format: string;
  release: any;
  res: Response;
  type: "album" | "edition" | "single";
}

const zipDownload = async ({ editionId, format, release, res, type }: ZipStream) => {
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

    if (artworkStream) {
      archive.append(artworkStream, { name: `${artistName} - ${releaseTitle}.jpg` });
      // Add white label artwork if art is missing?
    }

    const exclusiveTracks = new Set<string>();

    if (type === "edition") {
      const edition = await Edition.findOne({ editionId, release }).exec();
      edition?.metadata.properties.tracks.forEach(({ id }: { id: string }) => exclusiveTracks.add(id));
    }

    for (const { _id, isEditionOnly, position, trackTitle } of trackList) {
      const trackId = _id.toString();

      if (isEditionOnly && !exclusiveTracks.has(trackId)) {
        logger.info(`[track ${trackId}] Skipping exclusive track not found in edition ${editionId}.`);
        continue;
      }

      const trackFilename = `${position.toString(10).padStart(2, "0")} ${trackTitle}.${format}`;
      const trackStream = await streamFromBucket(buckets[format as keyof Buckets], `${releaseId}/${trackId}`);

      if (!trackStream) {
        const trackFilename = `${position.toString(10).padStart(2, "0")} ${trackTitle}.txt`;
        const text = `The track '${trackTitle}' by artist '${artistName}' is no longer available.`;
        archive.append(Readable.from(text), { name: trackFilename });
        logger.warn(`[track ${trackId}] Track stream not found.`);
        continue;
      }

      archive.append(trackStream, { name: trackFilename });
    }

    archive.finalize();
  } catch (error) {
    logger.error(error);
  }
};

export { zipDownload };
