import { Readable } from "stream";
import archiver from "archiver";
import { decryptStream } from "./encryption.js";
import tar from "tar-stream";

const zipDownload = async ({ ipfs, key, release, res, format }) => {
  try {
    const { artistName, artwork, releaseTitle, trackList } = release;
    const archive = archiver("zip");
    archive.on("end", () => console.log("Download archiving complete."));
    archive.on("error", console.log);
    archive.on("warning", console.log);
    res.attachment(`${artistName} - ${releaseTitle}.zip`);
    archive.pipe(res);

    await new Promise((resolve, reject) => {
      const tarExtract = tar.extract();
      tarExtract.on("error", reject);
      tarExtract.on("finish", resolve);

      tarExtract.on("entry", (header, artworkStream, next) => {
        artworkStream.on("end", next);
        archive.append(artworkStream, { name: `${artistName} - ${releaseTitle}.jpg` });
      });

      const cidArtwork = artwork.cid;
      const tarStream = Readable.from(ipfs.get(cidArtwork));
      tarStream.pipe(tarExtract);
    });

    for (const { [format]: cid, position, trackTitle } of trackList) {
      if (!cid) continue;
      const trackName = `${position.toString(10).padStart(2, "0")} ${trackTitle}.${format}`;

      await new Promise((resolve, reject) => {
        const tarExtract = tar.extract();
        tarExtract.on("error", reject);
        tarExtract.on("finish", resolve);

        tarExtract.on("entry", async (header, trackStream, next) => {
          const decryptedStream = await decryptStream(trackStream, key);
          decryptedStream.on("end", next);
          archive.append(decryptedStream, { name: trackName });
        });

        const tarStream = Readable.from(ipfs.get(cid));
        tarStream.pipe(tarExtract);
      });
    }

    archive.finalize();
  } catch (error) {
    console.log(error);
  }
};

export { zipDownload };
