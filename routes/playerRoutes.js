const aws = require('aws-sdk');

const BUCKET_OPT =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-opt' : 'nemp3-opt-testnet';

module.exports = app => {
  app.get('/api/play-track', async (req, res) => {
    const { albumId, trackId } = req.query;
    const s3 = new aws.S3();

    s3.listObjectsV2(
      { Bucket: BUCKET_OPT, Prefix: `m4a/${albumId}/${trackId}` },
      async (err, data) => {
        const params = {
          Bucket: BUCKET_OPT,
          Expires: 60 * 5,
          Key: data.Contents[0].Key
        };
        const playUrl = await s3.getSignedUrl('getObject', params);
        res.send(playUrl);
      }
    );
  });
};
