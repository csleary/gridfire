import { Response } from "express";
import archiver from "archiver";
import { getArtworkStream } from "gridfire/controllers/artworkController.js";
import { streamFromBucket } from "gridfire/controllers/storage.js";
import assert from "assert/strict";

const { BUCKET_FLAC, BUCKET_MP3 } = process.env;

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
    archive.on("end", () => console.log(`Download archiving complete for release ${releaseId}.`));
    archive.on("error", console.error);
    archive.on("warning", console.log);
    res.attachment(`${artistName} - ${releaseTitle}.zip`);
    archive.pipe(res);
    const artworkStream = await getArtworkStream(releaseId.toString());
    archive.append(artworkStream, { name: `${artistName} - ${releaseTitle}.jpg` });

    for (const { _id, isEditionOnly, position, trackTitle } of trackList) {
      if (!isEdition && isEditionOnly) continue;
      const trackId = _id.toString();
      const trackName = `${position.toString(10).padStart(2, "0")} ${trackTitle}.${format}`;
      const trackStream = await streamFromBucket(buckets[format as keyof Buckets], `${releaseId}/${trackId}`);
      archive.append(trackStream, { name: trackName });
    }

    archive.finalize();
  } catch (error) {
    console.error(error);
  }
};

export { zipDownload };
