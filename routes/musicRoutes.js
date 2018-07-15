const archiver = require('archiver');
const aws = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const nem = require('nem-sdk').default;
const request = require('request');
const SHA256 = require('crypto-js/sha256');
const sharp = require('sharp');
const keys = require('../config/keys');
const requireLogin = require('../middlewares/requireLogin');
const utils = require('./utils');

const Artist = mongoose.model('artists');
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');
const upload = multer({ dest: 'tmp/' });
aws.config.region = 'us-east-1';
const BUCKET_IMG = 'nemp3-img';
const BUCKET_SRC =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-src' : 'nemp3-src-testnet';
const BUCKET_OPT =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-opt' : 'nemp3-opt-testnet';

const userOwnsRelease = (user, release) => {
  if (user._id.toString() === release.user.toString()) {
    return true;
  }
  return false;
};

module.exports = app => {
  // Add New Release
  // Possibly check for upload tokens/credit.
  app.post('/api/release', requireLogin, async (req, res) => {
    const release = await new Release({
      user: req.user.id,
      dateCreated: Date.now()
    });
    release
      .save()
      .then(newRelease => res.send(newRelease))
      .catch(error => res.status(500).send({ error }));
  });

  // Add Track
  app.put('/api/:releaseId/add', requireLogin, async (req, res) => {
    const { releaseId } = req.params;
    const release = await Release.findById(releaseId);

    if (!userOwnsRelease(req.user, release)) {
      res.status(401).send({ error: 'Not authorised.' });
      return;
    }
    release.trackList.push({});
    release
      .save()
      .then(updated => res.send(updated))
      .catch(error => res.status(500).send({ error }));
  });

  // Delete Artwork
  app.delete('/api/artwork/:releaseId', requireLogin, async (req, res) => {
    const { releaseId } = req.params;
    const release = await Release.findById(releaseId);

    if (!userOwnsRelease(req.user, release)) {
      res.status(401).send({ error: 'Not authorised.' });
      return;
    }
    // Delete from S3
    const s3 = new aws.S3();
    s3.listObjectsV2(
      {
        Bucket: BUCKET_IMG,
        Prefix: `${releaseId}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteArt = await s3.deleteObject({
            Bucket: BUCKET_IMG,
            Key: data.Contents[0].Key
          });
          deleteArt.send();
        }
      }
    );

    release.artwork = undefined;
    release.save();
    res.send(release);
  });

  // Delete Release
  app.delete('/api/release/:releaseId', requireLogin, async (req, res) => {
    const { releaseId } = req.params;
    const release = await Release.findById(releaseId);

    if (!userOwnsRelease(req.user, release)) {
      res.status(401).send({ error: 'Not authorised.' });
      return;
    }
    // Delete from db
    const result = await Release.findByIdAndRemove(releaseId);

    // Delete audio from S3
    const s3 = new aws.S3();
    // Delete source audio
    s3.listObjectsV2(
      {
        Bucket: BUCKET_SRC,
        Prefix: `${releaseId}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteAudio = await s3.deleteObjects({
            Bucket: BUCKET_SRC,
            Delete: {
              Objects: data.Contents.map(track => ({
                Key: track.Key
              }))
            }
          });
          deleteAudio.send();
        }
      }
    );

    // Delete streaming audio
    s3.listObjectsV2(
      {
        Bucket: BUCKET_OPT,
        Prefix: `m4a/${releaseId}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteAudio = await s3.deleteObjects({
            Bucket: BUCKET_OPT,
            Delete: {
              Objects: data.Contents.map(track => ({
                Key: track.Key
              }))
            }
          });
          deleteAudio.send();
        }
      }
    );

    // Delete art from S3
    s3.listObjectsV2(
      {
        Bucket: BUCKET_IMG,
        Prefix: `${releaseId}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteArt = await s3.deleteObject({
            Bucket: BUCKET_IMG,
            Key: data.Contents[0].Key
          });
          deleteArt.send();
        }
      }
    );
    res.send(result._id);
  });

  // Delete Track
  app.delete('/api/:releaseId/:trackId', requireLogin, async (req, res) => {
    const { releaseId, trackId } = req.params;
    const release = await Release.findById(releaseId);

    if (!userOwnsRelease(req.user, release)) {
      res.status(401).send({ error: 'Not authorised.' });
      return;
    }
    // Delete from S3
    const s3 = new aws.S3();
    // Delete source audio
    const sourceParams = {
      Bucket: BUCKET_SRC,
      Prefix: `${releaseId}/${trackId}`
    };

    s3.listObjectsV2(sourceParams, async (err, data) => {
      if (data.Contents.length) {
        const deleteAudio = await s3.deleteObject({
          Bucket: BUCKET_SRC,
          Key: data.Contents[0].Key
        });
        deleteAudio.send();
      }
    });

    // Delete streaming audio
    const optParams = {
      Bucket: BUCKET_OPT,
      Prefix: `m4a/${releaseId}/${trackId}`
    };

    s3.listObjectsV2(optParams, async (err, data) => {
      if (data.Contents.length) {
        const deleteAudio = await s3.deleteObject({
          Bucket: BUCKET_OPT,
          Key: data.Contents[0].Key
        });
        deleteAudio.send();
      }
    });

    // Delete from db
    const releaseDeleted = await Release.findByIdAndUpdate(
      releaseId,
      { $pull: { trackList: { _id: trackId } } },
      { new: true }
    );
    res.send(releaseDeleted);
  });

  // Download Release
  app.get('/api/download/:token', async (req, res) => {
    const archive = archiver('zip');
    const s3 = new aws.S3();
    const token = req.params.token.substring(7);
    const decoded = jwt.verify(token, keys.nemp3Secret);
    const { releaseId } = decoded;
    const prefix =
      process.env.NEM_NETWORK === 'mainnet' ? `${releaseId}` : 'test/test';
    const release = await Release.findById(releaseId);
    const { trackList } = release;

    s3.listObjectsV2(
      {
        Bucket: BUCKET_SRC,
        Prefix: prefix
      },
      async (err, data) => {
        const downloadUrlsList = async () => {
          const urls = [];
          const tracks = data.Contents;

          tracks.forEach(async track => {
            const title =
              process.env.NEM_NETWORK === 'mainnet'
                ? trackList.filter(_track => track.Key.includes(_track._id))[0]
                    .trackTitle
                : 'Test Track';

            const ext = track.Key.substring(track.Key.lastIndexOf('.'));

            const params = {
              Bucket: BUCKET_SRC,
              Expires: 60 * 5,
              Key: track.Key
            };

            const url = await s3.getSignedUrl('getObject', params);
            urls.push({ ext, title, url });
          });
          return urls;
        };
        const downloadUrls = await downloadUrlsList();

        archive.on('end', () => {});

        archive.on('error', error => {
          res.status(500).send({ error: error.message });
        });

        res.attachment(`${release.artistName} - ${release.releaseTitle}.zip`);
        archive.pipe(res);

        downloadUrls.forEach((track, index) => {
          const trackNumber =
            process.env.NEM_NETWORK === 'mainnet'
              ? release.trackList.findIndex(_track =>
                  track.url.includes(_track._id)
                ) + 1
              : index + 1;

          archive.append(request(track.url, { encoding: null }), {
            name: `${trackNumber.toString(10).padStart(2, '0')} ${track.title}${
              track.ext
            }`
          });
        });
        archive.finalize();
      }
    );
  });

  // Fetch Collection
  app.get('/api/collection/', requireLogin, async (req, res) => {
    const { purchases } = req.user;
    const releaseIds = purchases.map(release => release.releaseId);
    const releases = await Release.find({ _id: { $in: releaseIds } }).sort(
      '-releaseDate'
    );
    res.send(releases);
  });

  // Fetch Artist Catalogue
  app.get('/api/catalogue/:artist', async (req, res) => {
    const { artist } = req.params;

    const catalogue = await Artist.findById(artist).populate({
      path: 'releases',
      model: Release,
      options: {
        sort: { releaseDate: -1 }
      }
    });
    res.send(catalogue);
  });

  // Fetch Catalogue
  app.get('/api/catalogue', async (req, res) => {
    const releases = await Release.find({ published: true })
      .limit(30)
      .sort('-releaseDate');
    res.send(releases);
  });

  // Fetch Download token
  app.post('/api/download', requireLogin, async (req, res) => {
    const { releaseId } = req.body;
    const user = await User.findById(req.user._id);
    const hasPreviouslyPurchased = user.purchases.some(purchase =>
      purchase.releaseId.equals(releaseId)
    );

    if (hasPreviouslyPurchased) {
      const token = jwt.sign(
        {
          releaseId,
          expiresIn: '10m'
        },
        keys.nemp3Secret
      );
      res.append('Authorization', `Bearer ${token}`);
      res.send({ success: 'Success.' });
    } else {
      res.status(401).send({ error: 'Not authorised.' });
    }
  });

  // Fetch Release
  app.get('/api/release/:releaseId', async (req, res) => {
    const release = await Release.findOne({ _id: req.params.releaseId });
    if (
      !release.published &&
      release.user.toString() !== req.user._id.toString()
    ) {
      res.send({ error: 'Release currently unavailable.' });
    } else {
      const artist = await User.findOne({ _id: release.user });
      const paymentInfo = {
        paymentAddress: nem.utils.format.address(artist.nemAddress)
      };
      res.send({ release, paymentInfo });
    }
  });

  // Fetch Release Sales Figures
  app.get('/api/sales', requireLogin, async (req, res) => {
    const releases = await Release.find({ user: req.user.id });
    const releaseIds = releases.map(release => release._id);
    const sales = await Sale.find({ releaseId: { $in: releaseIds } });
    res.send(sales);
  });

  // Fetch Single User Release
  app.get('/api/user/release/:releaseId', requireLogin, async (req, res) => {
    const release = await Release.findById(req.params.releaseId);
    res.send(release);
  });

  // Fetch User Releases
  app.get('/api/user/releases/', requireLogin, async (req, res) => {
    const releases = await Release.find({ user: req.user.id }).sort(
      '-releaseDate'
    );
    res.send(releases);
  });

  // Move track position
  app.patch('/api/:releaseId/:from/:to', requireLogin, async (req, res) => {
    const { releaseId, from, to } = req.params;
    const release = await Release.findById(releaseId);

    if (!userOwnsRelease(req.user, release)) {
      res.status(401).send({ error: 'Not authorised.' });
      return;
    }
    release.trackList.splice(to, 0, release.trackList.splice(from, 1)[0]);
    release.save();
    res.send(release);
  });

  // Purchase Release
  app.get('/api/purchase/:releaseId', requireLogin, async (req, res) => {
    req.session.price = null;
    const { releaseId } = req.params;
    const release = await Release.findById(releaseId);
    const artist = await User.findById(release.user);
    const customerIdHash = req.user.auth.idHash;
    const xemPriceUsd = await utils.getXemPrice();
    const price = (release.price / xemPriceUsd).toFixed(6); // Convert depending on currency used.
    req.session.price = price;

    const paymentHash = SHA256(release._id + customerIdHash)
      .toString()
      .substring(0, 31);

    const paymentInfo = {
      paymentAddress: nem.utils.format.address(artist.nemAddress),
      paymentHash
    };
    res.send({ release, paymentInfo, price });
  });

  // Toggle Release Status
  app.patch('/api/release/:releaseId', requireLogin, async (req, res) => {
    const release = await Release.findById(req.params.releaseId);

    if (!userOwnsRelease(req.user, release)) {
      res.status(401).send({ error: 'Not authorised.' });
      return;
    }
    release.published = !release.published;
    release.save();
    res.send(release);
  });

  // Transcode Audio
  app.get('/api/transcode/audio', requireLogin, async (req, res) => {
    const { releaseId, trackId } = req.query;
    const s3 = new aws.S3();
    const key = `${releaseId}/${trackId}`;
    const listParams = {
      Bucket: BUCKET_SRC,
      Prefix: key
    };

    s3.listObjectsV2(listParams, async (err, inputAudio) => {
      const transcoder = new aws.ElasticTranscoder();
      const transcoderParams = {
        PipelineId: '1513688795531-iszg5h',
        Inputs: [
          {
            Key: inputAudio.Contents[0].Key,
            Container: 'auto'
          }
        ],
        Outputs: [
          {
            Key: `${releaseId}/${trackId}.m4a`,
            PresetId: '1351620000001-100130'
          }
        ],
        OutputKeyPrefix: 'm4a/'
      };

      transcoder.createJob(transcoderParams, (error, data) => {
        if (error) {
          res.status(500).send(error, error.stack);
        } else res.send(data);
      });
    });
  });

  // Upload Artwork
  app.post(
    '/api/upload/artwork',
    upload.single('artwork'),
    requireLogin,
    async (req, res) => {
      const { releaseId } = req.body;

      // If replacing, delete from S3
      const s3 = new aws.S3();
      s3.listObjectsV2(
        {
          Bucket: BUCKET_IMG,
          Prefix: `${releaseId}`
        },
        async (err, data) => {
          if (data.Contents.length) {
            const deleteArt = await s3.deleteObject({
              Bucket: BUCKET_IMG,
              Key: data.Contents[0].Key
            });
            deleteArt.send();
          }
        }
      );

      sharp(req.file.path)
        .resize(1000, 1000)
        .crop()
        .toFormat('jpeg')
        .toBuffer()
        .then(async optimised => {
          // Upload new artwork
          const ext = '.jpg';
          const type = 'image/jpeg';
          const params = {
            ContentType: `${type}`,
            Bucket: BUCKET_IMG,
            Expires: 30,
            Key: `${releaseId}${ext}`
          };

          const release = await Release.findById(releaseId);
          release.artwork = `https://s3.amazonaws.com/nemp3-img/${releaseId}${ext}`;
          release.save();

          const config = {
            headers: {
              'Content-Type': type
            }
          };

          s3.getSignedUrl('putObject', params, async (error, url) => {
            if (error) null;

            axios
              .put(url, optimised, config)
              .then(() => {
                fs.unlink(req.file.path, err => {
                  if (err) {
                    throw new Error('Error occurred while deleting artwork.');
                  }
                });
                res.end();
              })
              .catch(err => {
                res.status(500).send({ error: err });
              });
          });
        });
    }
  );

  // Upload Audio
  app.get('/api/upload/audio', requireLogin, async (req, res) => {
    const { releaseId, trackId, type } = req.query;
    const release = await Release.findById(releaseId);

    let ext;
    if (type === 'audio/wav') {
      ext = '.wav';
    } else if (type === 'audio/aiff') {
      ext = '.aiff';
    }

    const s3 = new aws.S3();
    const key = `${releaseId}/${trackId}${ext}`;
    const params = {
      ContentType: `${type}`,
      Bucket: BUCKET_SRC,
      Expires: 30,
      Key: key
    };

    s3.getSignedUrl('putObject', params, (error, url) => {
      if (error) {
        res.status(500).send({ error });
      } else {
        const index = release.trackList.findIndex(
          track => track._id.toString() === trackId
        );
        release.trackList[index].hasAudio = true;
        release.save();
        res.send(url);
      }
    });
  });

  // Update Release
  app.put('/api/release', requireLogin, async (req, res) => {
    const releaseId = req.body._id;
    const {
      artistName,
      catNumber,
      cLine,
      credits,
      info,
      pLine,
      price,
      recordLabel,
      releaseDate,
      releaseTitle
    } = req.body;

    const release = await Release.findById(releaseId);
    release.artistName = artistName;
    release.catNumber = catNumber;
    release.credits = credits;
    release.info = info;
    release.price = price;
    release.recordLabel = recordLabel;
    release.releaseDate = releaseDate;
    release.releaseTitle = releaseTitle;
    release.pLine.year = pLine && pLine.year;
    release.pLine.owner = pLine && pLine.owner;
    release.cLine.year = cLine && cLine.year;
    release.cLine.owner = cLine && cLine.owner;
    release.trackList.forEach((track, index) => {
      track.trackTitle = req.body.trackList[index].trackTitle;
    });
    release
      .save()
      .then(async updatedRelease => {
        const artist = await Artist.findOneAndUpdate(
          {
            user: req.user._id,
            name: artistName
          },
          {},
          { new: true, upsert: true }
        );

        release.update({ artist: artist._id }).exec();

        if (!artist.releases.some(id => id.equals(updatedRelease._id))) {
          artist.update({ $push: { releases: updatedRelease._id } }).exec();
        }
        return artist;
      })
      .then(async updatedArtist =>
        User.findOneAndUpdate(
          {
            _id: req.user._id,
            artists: { $ne: updatedArtist._id }
          },
          {
            $push: { artists: updatedArtist._id }
          },
          { new: true }
        )
      )
      .then(() => res.send(release))
      .catch(error => res.status(500).send({ error }));
  });
};
