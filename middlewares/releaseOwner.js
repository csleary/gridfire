const mongoose = require('mongoose');
const Release = mongoose.model('releases');

module.exports = async (req, res, next) => {
  const releaseId = req.body.releaseId || req.params.releaseId || req.query.releaseId;
  if (!releaseId) return res.status(401).send({ error: 'Not authorised.' });
  const release = await Release.findById(releaseId, '-__v').exec();
  if (release.user.equals(req.user._id)) return next();
  res.status(401).send({ error: 'Not authorised.' });
};
