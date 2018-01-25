const archiver = require('archiver');
const aws = require('aws-sdk');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const request = require('request');
const SHA256 = require('crypto-js/sha256');
const keys = require('../config/keys');
const requireLogin = require('../middlewares/requireLogin');

const Release = mongoose.model('releases');
const User = mongoose.model('users');
aws.config.region = 'us-east-1';

module.exports = app => {
  // Add New Release
  app.post('/api/release', requireLogin, async (req, res) => {
    const release = await new Release({
      _user: req.user.id,
      dateCreated: Date.now()
    }).save();
    res.send(release);
  });

  // Add Track
  app.put('/api/:releaseId/add', requireLogin, async (req, res) => {
    const release = await Release.findByIdAndUpdate(
      req.params.releaseId,
      { $push: { trackList: {} } },
      { new: true }
    );
    res.send(release);
  });

  // Delete Artwork
  app.delete('/api/artwork/:id', requireLogin, async (req, res) => {
    const { id } = req.params;

    // Delete from S3
    const s3 = new aws.S3();
    s3.listObjectsV2(
      {
        Bucket: 'nemp3-img',
        Prefix: `${id}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteArt = await s3.deleteObject({
            Bucket: 'nemp3-img',
            Key: data.Contents[0].Key
          });
          deleteArt.send();
        }
      }
    );

    // Delete from db
    const release = await Release.findByIdAndUpdate(
      id,
      { $set: { artwork: undefined } },
      { new: true }
    );
    res.send(release);
  });

  // Delete Release
  app.delete('/api/release/:id', requireLogin, async (req, res) => {
    const { id } = req.params;

    // Delete audio from S3
    const s3 = new aws.S3();
    // Delete source audio
    s3.listObjectsV2(
      {
        Bucket: 'nemp3-src',
        Prefix: `${id}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteAudio = await s3.deleteObjects({
            Bucket: 'nemp3-src',
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
        Bucket: 'nemp3-opt',
        Prefix: `${id}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteAudio = await s3.deleteObjects({
            Bucket: 'nemp3-opt',
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
        Bucket: 'nemp3-img',
        Prefix: `${id}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteArt = await s3.deleteObject({
            Bucket: 'nemp3-img',
            Key: data.Contents[0].Key
          });
          deleteArt.send();
        }
      }
    );

    // Delete from db
    const result = await Release.findByIdAndRemove(id);
    res.send(result._id);
  });

  // Delete Track
  app.delete('/api/:releaseId/:trackId', requireLogin, async (req, res) => {
    const { releaseId, trackId } = req.params;

    // Delete from S3
    const s3 = new aws.S3();
    // Delete source audio
    const sourceParams = {
      Bucket: 'nemp3-src',
      Prefix: `${releaseId}/${trackId}`
    };

    s3.listObjectsV2(sourceParams, async (err, data) => {
      if (data.Contents.length) {
        const deleteAudio = await s3.deleteObject({
          Bucket: 'nemp3-src',
          Key: data.Contents[0].Key
        });
        deleteAudio.send();
      }
    });

    // Delete streaming audio
    const optParams = {
      Bucket: 'nemp3-opt',
      Prefix: `m4a/${releaseId}/${trackId}`
    };

    s3.listObjectsV2(optParams, async (err, data) => {
      if (data.Contents.length) {
        const deleteAudio = await s3.deleteObject({
          Bucket: 'nemp3-opt',
          Key: data.Contents[0].Key
        });
        deleteAudio.send();
      }
    });

    // Delete from db
    const release = await Release.findByIdAndUpdate(
      releaseId,
      { $pull: { trackList: { _id: trackId } } },
      { new: true }
    );
    res.send(release);
  });

  // Download Release
  app.get('/api/download/:token', async (req, res) => {
    const archive = archiver('zip');
    const s3 = new aws.S3();
    const token = req.params.token.substring(7);
    const decoded = jwt.verify(token, keys.nemp3Secret);
    const id = decoded.id;
    const prefix =
      process.env.NEM_NETWORK === 'mainnet' ? `${id}` : 'test/test';
    const release = await Release.findById(id);
    const { trackList } = release;

    s3.listObjectsV2(
      {
        Bucket: 'nemp3-src',
        Prefix: prefix
      },
      async (err, data) => {
        const downloadUrlsList = async () => {
          const urls = [];
          const tracks = data.Contents;

          tracks.forEach(async track => {
            const title =
              process.env.NEM_NETWORK === 'mainnet'
                ? trackList.filter(tr => track.Key.includes(tr._id))[0]
                    .trackTitle
                : 'Test Track';

            const ext = track.Key.substring(track.Key.lastIndexOf('.'));

            const params = {
              Bucket: 'nemp3-src',
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
              ? release.trackList.findIndex(tr => track.url.includes(tr._id)) +
                1
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

  // Fetch Catalogue
  app.get('/api/catalogue', async (req, res) => {
    const releases = await Release.find({ published: true })
      .limit(30)
      .sort('-releaseDate');
    res.send(releases);
  });

  // Fetch Release
  app.get('/api/release/:id', async (req, res) => {
    const release = await Release.findOne({ _id: req.params.id });
    const artist = await User.findOne({ _id: release._user });
    const paymentInfo = {
      paymentAddress: nem.utils.format.address(artist.nemAddress)
    };
    res.send({ release, paymentInfo });
  });

  // Fetch Single User Release
  app.get('/api/user/release/:id', requireLogin, async (req, res) => {
    const release = await Release.findById(req.params.id);
    res.send(release);
  });

  // Fetch User Releases
  app.get('/api/user/releases/', requireLogin, async (req, res) => {
    const releases = await Release.find({ _user: req.user.id }).sort(
      '-releaseDate'
    );
    res.send(releases);
  });

  // Move track position
  app.patch('/api/:releaseId/:from/:to', requireLogin, async (req, res) => {
    const { releaseId, from, to } = req.params;
    const release = await Release.findById(releaseId);
    release.trackList.splice(to, 0, release.trackList.splice(from, 1)[0]);
    release.save();
    res.send(release);
  });

  // Purchase Release
  app.get('/api/purchase/:id', requireLogin, async (req, res) => {
    const release = await Release.findOne({ _id: req.params.id });
    const artist = await User.findOne({ _id: release._user });
    const customerIdHash = req.user.auth.idHash;
    const paymentHash = SHA256(release._id + customerIdHash)
      .toString()
      .substring(0, 31);
    const paymentInfo = {
      paymentAddress: nem.utils.format.address(artist.nemAddress),
      paymentHash
    };
    res.send({ release, paymentInfo });
  });

  // Toggle Release Status
  app.patch('/api/release/:id', requireLogin, async (req, res) => {
    const release = await Release.findById(req.params.id);
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
      Bucket: 'nemp3-src',
      Prefix: key
    };

    s3.listObjectsV2(listParams, async (err, inputAudio) => {
      const transcoder = new aws.ElasticTranscoder();
      const transcoderParams = {
        PipelineId: '1513688795531-iszg5h' /* required */,
        Inputs: [
          {
            Key: inputAudio.Contents[0].Key,
            Container: 'auto'
          }
        ],
        Outputs: [
          {
            Key: `${releaseId}/${trackId}.m4a`,
            PresetId: '1351620000001-100120'
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
  app.get('/api/upload/artwork', requireLogin, async (req, res) => {
    const { id, type } = req.query;

    // If replacing, delete from S3
    const s3 = new aws.S3();
    s3.listObjectsV2(
      {
        Bucket: 'nemp3-img',
        Prefix: `${id}`
      },
      async (err, data) => {
        if (data.Contents.length) {
          const deleteArt = await s3.deleteObject({
            Bucket: 'nemp3-img',
            Key: data.Contents[0].Key
          });
          deleteArt.send();
        }
      }
    );

    // Upload new artwork
    let ext;
    if (type === 'image/jpeg') {
      ext = '.jpg';
    } else if (type === 'image/png') {
      ext = '.png';
    }

    const params = {
      ContentType: `${type}`,
      Bucket: 'nemp3-img',
      Expires: 30,
      Key: `${id}${ext}`
    };

    s3.getSignedUrl('putObject', params, async (error, url) => {
      if (error) null;
      const release = await Release.findById(id);
      release.artwork = `https://s3.amazonaws.com/nemp3-img/${id}${ext}`;
      release.save();
      res.send(url);
    });
  });

  // Upload Audio
  app.get('/api/upload/audio', requireLogin, async (req, res) => {
    const { releaseId, trackId, type } = req.query;
    const release = await Release.findById(releaseId);
    // const trackId = release.trackList[index]._id;

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
      Bucket: 'nemp3-src',
      Expires: 30,
      Key: key
    };

    s3.getSignedUrl('putObject', params, (error, url) => {
      const index = release.trackList.findIndex(
        track => track._id.toString() === trackId
      );
      release.trackList[index].hasAudio = true;
      release.save();
      res.send(url);
    });
  });

  // Update Release
  app.put('/api/release', requireLogin, async (req, res) => {
    const id = req.body._id;
    const {
      artistName,
      catNumber,
      price,
      recordLabel,
      releaseDate,
      releaseTitle
    } = req.body;
    const release = await Release.findById(id);
    release.artistName = artistName;
    release.catNumber = catNumber;
    release.price = price;
    release.recordLabel = recordLabel;
    release.releaseDate = releaseDate;
    release.releaseTitle = releaseTitle;
    release.trackList.forEach((track, index) => {
      track.trackTitle = req.body.trackList[index].trackTitle;
    });
    release.save();
    res.send(release);
  });
};
