import { Readable } from "stream";
import archiver from "archiver";
import tar from "tar-stream";

const zipDownload = async ({ ipfs, release, res, format }) => {
  try {
    const { artistName, artwork, releaseTitle, trackList } = release;
    const archive = archiver("zip");
    archive.on("end", () => console.log("Archiver complete."));
    archive.on("warning", console.log);
    archive.on("error", console.log);
    res.attachment(`${artistName} - ${releaseTitle}.zip`);
    archive.pipe(res);

    await new Promise((resolve, reject) => {
      const tarExtract = tar.extract();
      tarExtract.on("error", reject);
      tarExtract.on("finish", resolve);

      tarExtract.on("entry", (header, artworkStream, next) => {
        console.log(header);
        artworkStream.on("end", next);
        archive.append(artworkStream, { name: `${artistName} - ${releaseTitle}.jpg` });
        artworkStream.resume();
      });

      const cidArtwork = artwork.cid;
      const tarStream = Readable.from(ipfs.get(cidArtwork));
      tarStream.pipe(tarExtract);
    });

    let trackNumber = 1;
    for (const { cids, trackTitle } of trackList) {
      await new Promise((resolve, reject) => {
        const tarExtract = tar.extract();
        tarExtract.on("error", reject);
        tarExtract.on("finish", resolve);

        tarExtract.on("entry", (header, trackStream, next) => {
          console.log(header);
          trackStream.on("end", next);
          archive.append(trackStream, { name: `${trackNumber.toString(10).padStart(2, "0")} ${trackTitle}.${format}` });
          trackStream.resume();
        });

        const tarStream = Readable.from(ipfs.get(cids[format]));
        tarStream.pipe(tarExtract);
      });

      trackNumber++;
    }

    archive.finalize();
  } catch (error) {
    console.log(error);
  }
};

export { zipDownload };
