const mongoose = require('mongoose');
const Release = mongoose.model('releases');

module.exports = async (req, res, next) => {
  const releaseId = req.body.releaseId || req.params.releaseId || req.query.releaseId;
  if (!releaseId) return res.status(401).send({ error: 'A release ID is required.' });
  const isUserRelease = await Release.exists({ _id: releaseId, user: req.user._id });
  if (!isUserRelease) res.status(401).send({ error: 'User is not authorised.' });
  return next();
};
