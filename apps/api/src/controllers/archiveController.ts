import { getArtworkStream } from "@gridfire/api/controllers/artworkController";
import { streamFromBucket } from "@gridfire/shared";
import Logger from "@gridfire/shared/logger";
import Edition from "@gridfire/shared/models/Edition";
import Release from "@gridfire/shared/models/Release";
import archiver from "archiver";
import { Response } from "express";
import { ObjectId } from "mongoose";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const { BUCKET_FLAC, BUCKET_MP3 } = process.env;
assert(BUCKET_FLAC, "BUCKET_FLAC env var not set.");
assert(BUCKET_MP3, "BUCKET_MP3 env var not set.");
const logger = new Logger("archiveController");

export enum Formats {
  Flac = "flac",
  Mp3 = "mp3"
}

enum SaleType {
  Album = "album",
  Edition = "edition",
  Single = "single"
}
interface Buckets {
  [Formats.Flac]: string;
  [Formats.Mp3]: string;
}

interface ZipStream {
  editionId: null | string;
  format: Formats;
  release: ObjectId;
  res: Response;
  type: SaleType;
}

const buckets: Buckets = { [Formats.Flac]: BUCKET_FLAC, [Formats.Mp3]: BUCKET_MP3 };

const zipDownload = async ({ editionId, format, release, res, type }: ZipStream) => {
  try {
    if (type === SaleType.Edition && !editionId) {
      throw new Error("Edition ID is required for edition downloads.");
    }

    const archive = archiver("zip");
    archive.on("end", () => logger.info(`Download archiving complete for release ${release} [${type}].`));
    archive.on("error", error => logger.error("Archiver error:", error));
    archive.on("warning", error => logger.warn("Archiver warning:", error));
    const streamPromise = pipeline(archive, res);

    switch (type) {
      case SaleType.Album:
        {
          const fullRelease = await Release.findById(release).lean();

          if (!fullRelease) {
            return void res.sendStatus(404);
          }

          const { _id: releaseId, artistName, releaseTitle, trackList } = fullRelease;
          res.attachment(`${artistName} - ${releaseTitle}.zip`);
          const artworkStream = await getArtworkStream(releaseId.toString());

          if (artworkStream) {
            archive.append(artworkStream, { name: `${artistName} - ${releaseTitle}.webp` });
          }

          for (const { _id, isEditionOnly, position, trackTitle } of trackList) {
            const trackId = _id.toString();
            if (isEditionOnly) continue;
            const trackFilename = `${position.toString(10).padStart(2, "0")} ${trackTitle}.${format}`;
            const trackStream = await streamFromBucket(buckets[format], `${releaseId}/${trackId}`);

            if (!trackStream) {
              const trackFilename = `${position.toString(10).padStart(2, "0")} ${trackTitle}.txt`;
              const text = `The track '${trackTitle}' by artist '${artistName}' is no longer available.`;
              archive.append(Readable.from(text), { name: trackFilename });
              logger.warn(`[track ${trackId}] Track stream not found.`);
              continue;
            }

            archive.append(trackStream, { name: trackFilename });
          }
        }
        break;
      case SaleType.Edition:
        {
          const exclusiveTracks = new Set<string>();
          const edition = await Edition.findOne({ editionId, release }).exec();

          if (!edition) {
            return void res.sendStatus(404);
          }

          edition.metadata.properties.tracks.forEach(({ id }: { id: string }) => exclusiveTracks.add(id));
          const fullRelease = await Release.findById(release).lean();

          if (!fullRelease) {
            return void res.sendStatus(404);
          }

          const { _id: releaseId, artistName, releaseTitle, trackList } = fullRelease;
          res.attachment(`${artistName} - ${releaseTitle}.zip`);
          const artworkStream = await getArtworkStream(releaseId.toString());

          if (artworkStream) {
            archive.append(artworkStream, { name: `${artistName} - ${releaseTitle}.webp` });
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
        }
        break;
      case SaleType.Single:
        {
          const fullRelease = await Release.findOne(
            { "trackList._id": release },
            "artist artistName releaseTitle trackList.$"
          ).lean();

          if (!fullRelease) {
            return void res.sendStatus(404);
          }

          const { _id: releaseId, artistName, releaseTitle, trackList } = fullRelease;
          res.attachment(`${artistName} - ${releaseTitle}.zip`);
          const artworkStream = await getArtworkStream(releaseId.toString());

          if (artworkStream) {
            archive.append(artworkStream, { name: `${artistName} - ${releaseTitle}.webp` });
          }

          for (const { _id, position, trackTitle } of trackList) {
            const trackId = _id.toString();
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
        }
        break;
      default:
        throw new Error(`Unknown sale type '${type}' for release ${release}.`);
    }

    archive.finalize();
    await streamPromise;
  } catch (error) {
    logger.error(error);

    if (!res.headersSent) {
      res.sendStatus(500);
    } else {
      res.end();
    }
  }
};

export { zipDownload };
