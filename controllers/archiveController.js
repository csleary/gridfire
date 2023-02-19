import archiver from "archiver";
import { decryptStream } from "./encryption.js";
import { getArtworkStream } from "gridfire/controllers/artworkController.js";
import { streamFromBucket } from "gridfire/controllers/storage.js";

const { BUCKET_FLAC, BUCKET_MP3 } = process.env;
const buckets = { flac: BUCKET_FLAC, mp3: BUCKET_MP3 };

const zipDownload = async ({ isEdition, key, release, res, format }) => {
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
      const trackStream = await streamFromBucket(buckets[format], `${releaseId}/${trackId}`);
      const decryptedStream = await decryptStream(trackStream, key);
      archive.append(decryptedStream, { name: trackName });
    }

    archive.finalize();
  } catch (error) {
    console.error(error);
  }
};

export { zipDownload };
