const aws = require('aws-sdk');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const fsPromises = require('fs').promises;
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const sax = require('sax');
const {
  AWS_REGION,
  BENTO4_DIR,
  BUCKET_OPT,
  BUCKET_SRC,
  TEMP_PATH
} = require('./constants');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');

aws.config.update({ region: AWS_REGION });
const Release = mongoose.model('releases');
const upload = multer();

module.exports = app => {
  // Add Track
  app.put(
    '/api/:releaseId/add',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      const release = res.locals.release;
      release.trackList.push({});

      release
        .save()
        .then(updatedRelease =>
          res.send(updatedRelease.toObject({ versionKey: false }))
        )
        .catch(error => res.status(500).send({ error }));
    }
  );

  // Fetch Init Range and Segment List
  app.get('/api/:releaseId/:trackId/init', async (req, res) => {
    const { releaseId, trackId } = req.params;
    const s3 = new aws.S3();

    const release = await Release.findById(releaseId);
    const duration = release.trackList.id(trackId).duration;

    const mpdData = await s3
      .getObject({ Bucket: BUCKET_OPT, Key: `mpd/${releaseId}/${trackId}.mpd` })
      .promise();

    const strict = true;
    const parser = sax.parser(strict);
    let initRange;
    const segmentList = [];

    parser.onopentag = node => {
      if (node.name === 'Initialization') {
        initRange = node.attributes.range;
      }
    };

    parser.onattribute = attr => {
      if (attr.name === 'mediaRange') {
        segmentList.push(attr.value);
      }
    };

    parser.write(mpdData.Body).close();

    const mp4Params = {
      Bucket: BUCKET_OPT,
      Expires: 15,
      Key: `mp4/${releaseId}/${trackId}.mp4`
    };

    const url = s3.getSignedUrl('getObject', mp4Params);
    res.send({ duration, initRange, segmentList, url });
  });

  // Fetch Segment
  app.get('/api/:releaseId/:trackId/segment', async (req, res) => {
    const { releaseId, trackId } = req.params;
    const s3 = new aws.S3();

    const mp4List = await s3
      .listObjectsV2({
        Bucket: BUCKET_OPT,
        Prefix: `mp4/${releaseId}/${trackId}`
      })
      .promise();

    const Key = mp4List.Contents[0].Key;
    const mp4Params = {
      Bucket: BUCKET_OPT,
      Expires: 15,
      Key
    };

    const mp4Url = s3.getSignedUrl('getObject', mp4Params);
    res.send(mp4Url);
  });

  // Delete Track
  app.delete(
    '/api/:releaseId/:trackId',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      const { releaseId, trackId } = req.params;

      // Delete from S3
      const s3 = new aws.S3();

      // Delete source audio
      const listSrcParams = {
        Bucket: BUCKET_SRC,
        Prefix: `${releaseId}/${trackId}`
      };
      const s3SrcData = await s3.listObjectsV2(listSrcParams).promise();

      let deleteS3Src;
      if (s3SrcData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_SRC,
          Key: s3SrcData.Contents[0].Key
        };
        deleteS3Src = await s3.deleteObject(deleteImgParams).promise();
      }

      // Delete streaming audio
      const listOptParams = {
        Bucket: BUCKET_OPT,
        Prefix: `mp4/${releaseId}/${trackId}`
      };
      const s3OptData = await s3.listObjectsV2(listOptParams).promise();

      let deleteS3Opt;
      if (s3OptData.Contents.length) {
        const deleteOptParams = {
          Bucket: BUCKET_OPT,
          Key: s3OptData.Contents[0].Key
        };
        deleteS3Opt = await s3.deleteObject(deleteOptParams).promise();
      }

      // Delete mpd
      const listMpdParams = {
        Bucket: BUCKET_OPT,
        Prefix: `mpd/${releaseId}/${trackId}`
      };
      const s3MpdData = await s3.listObjectsV2(listMpdParams).promise();

      let deleteS3Mpd;
      if (s3MpdData.Contents.length) {
        const deleteMpdParams = {
          Bucket: BUCKET_OPT,
          Key: s3MpdData.Contents[0].Key
        };
        deleteS3Mpd = await s3.deleteObject(deleteMpdParams).promise();
      }

      // Delete from db
      const deleteTrackDb = new Promise(async resolve => {
        const release = await Release.findById(releaseId);
        release.trackList.id(trackId).remove();

        if (!release.trackList.length) {
          release.published = false;
        }

        release.save().then(updatedRelease => resolve(updatedRelease));
      });

      Promise.all([deleteS3Src, deleteS3Opt, deleteS3Mpd, deleteTrackDb])
        .then(promised => res.send(promised[3]))
        .catch(error => res.status(500).send({ error: error.message }));
    }
  );

  // Move track position
  app.patch(
    '/api/:releaseId/:from/:to',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { from, to } = req.params;
        const release = res.locals.release;
        release.trackList.splice(to, 0, release.trackList.splice(from, 1)[0]);
        release
          .save()
          .then(updatedRelease =>
            res.send(updatedRelease.toObject({ versionKey: false }))
          );
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );

  // Transcode Audio
  app.get(
    '/api/transcode/audio',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { releaseId, trackId, trackName } = req.query;
        const s3 = new aws.S3();

        const listParams = {
          Bucket: BUCKET_SRC,
          Prefix: `${releaseId}/${trackId}`
        };

        const inputAudio = await s3.listObjectsV2(listParams).promise();
        const { Key } = inputAudio.Contents[0];
        const outputPath = TEMP_PATH;
        const outputAudio = `${outputPath}${trackId}.mp4`;
        const outputMpd = `${outputPath}${trackId}.mpd`;

        const probeSrc = s3
          .getObject({ Bucket: BUCKET_SRC, Key })
          .createReadStream();

        ffmpeg.ffprobe(probeSrc, (error, metadata) => {
          if (error) {
            throw new Error(`Probing error: ${error.message}`);
          }
          const release = res.locals.release;
          const trackDoc = release.trackList.id(trackId);
          trackDoc.duration = metadata.format.duration;
          release.save();
        });

        const downloadSrc = s3
          .getObject({ Bucket: BUCKET_SRC, Key })
          .createReadStream();

        ffmpeg(downloadSrc)
          .audioCodec('libfdk_aac')
          .audioBitrate(128)
          .toFormat('mp4')
          // .on('stderr', () => {})
          .output(outputAudio)
          .outputOptions([
            '-frag_duration 15000000',
            '-movflags default_base_moof+empty_moov'
          ])
          .on('error', error => {
            throw new Error(`Transcoding error: ${error.message}`);
          })
          .on('end', async () => {
            exec(
              `mp4dash \
                --exec-dir=${BENTO4_DIR} \
                -f \
                --mpd-name=${trackId}.mpd \
                --no-media \
                --no-split \
                -o ${outputPath} \
                --use-segment-list \
                ${outputAudio}`,
              async error => {
                if (error) {
                  throw new Error(`mp4dash error: ${error.message}`);
                }

                const mp4Audio = await fsPromises.readFile(outputAudio);
                const mp4Params = {
                  Bucket: BUCKET_OPT,
                  ContentType: 'audio/mp4',
                  Key: `mp4/${releaseId}/${trackId}.mp4`,
                  Body: mp4Audio
                };
                const mp4Upload = s3.upload(mp4Params).promise();

                const mpd = await fsPromises.readFile(outputMpd);
                const mpdParams = {
                  Bucket: BUCKET_OPT,
                  ContentType: 'application/dash+xml',
                  Key: `mpd/${releaseId}/${trackId}.mpd`,
                  Body: mpd
                };
                const mpdUpload = s3.upload(mpdParams).promise();

                Promise.all([mp4Upload, mpdUpload])
                  .then(() => fsPromises.unlink(outputAudio))
                  .then(() => fsPromises.unlink(outputMpd))
                  .then(() => {
                    const release = res.locals.release;
                    const trackDoc = release.trackList.id(trackId);
                    trackDoc.hasAudio = true;
                    release.save().then(updatedRelease =>
                      res.send({
                        updatedRelease,
                        success: `Transcoding ${trackName} to aac complete.`
                      })
                    );
                  });
              }
            );
          })
          .run();
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );

  // Get Upload Url
  app.get('/api/upload/audio', requireLogin, releaseOwner, async (req, res) => {
    try {
      const { releaseId, trackId, type } = req.query;

      let ext;
      switch (type) {
      case 'audio/aiff':
        ext = '.aiff';
        break;
      case 'audio/flac':
        ext = '.flac';
        break;
      case 'audio/wav':
        ext = '.wav';
        break;
      default:
      }

      const s3 = new aws.S3();
      const key = `${releaseId}/${trackId}${ext}`;
      const params = {
        ContentType: `${type}`,
        Bucket: BUCKET_SRC,
        Expires: 30,
        Key: key
      };

      const audioUploadUrl = s3.getSignedUrl('putObject', params);
      res.send(audioUploadUrl);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Upload Audio
  app.post(
    '/api/upload/audio',
    upload.single('audio'),
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { releaseId, trackId, type } = req.body;
        const s3 = new aws.S3();
        const tempPath = path.join(TEMP_PATH, trackId);

        if (
          ![
            'audio/aiff',
            'audio/x-aiff',
            'audio/flac',
            'audio/vnd.wav',
            'audio/wav',
            'audio/x-wav'
          ].includes(type)
        ) {
          throw new Error(
            'File type not recognised. Needs to be flac/aiff/wav.'
          );
        }

        ffmpeg(req.file.stream)
          .audioCodec('flac')
          .audioChannels(2)
          .toFormat('flac')
          .outputOptions('-compression_level 5')
          .on('end', async () => {
            const s3Stream = await fsPromises.readFile(tempPath);
            const Key = `${releaseId}/${trackId}.flac`;
            const params = { Bucket: BUCKET_SRC, Key, Body: s3Stream };

            s3.upload(params)
              .promise()
              .then(() => fsPromises.unlink(tempPath))
              .then(() => res.end());
          })
          .save(tempPath);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );
};
