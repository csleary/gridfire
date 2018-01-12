const aws = require('aws-sdk');

module.exports = app => {
  app.get('/api/play-track', async (req, res) => {
    const { albumId, trackId } = req.query;
    const s3 = new aws.S3();

    s3.listObjectsV2(
      { Bucket: 'nemp3-opt', Prefix: `m4a/${albumId}/${trackId}` },
      async (err, data) => {
        const params = {
          Bucket: 'nemp3-opt',
          Expires: 60 * 5,
          Key: data.Contents[0].Key
        };
        const playUrl = await s3.getSignedUrl('getObject', params);
        res.send(playUrl);
      }
    );
  });
};
