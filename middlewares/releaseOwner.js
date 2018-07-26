const mongoose = require('mongoose');

const Release = mongoose.model('releases');

module.exports = async (req, res, next) => {
  const releaseId = req.params.releaseId || req.query.releaseId;
  const release = await Release.findById(releaseId);

  if (release.user.equals(req.user._id)) {
    res.locals.release = release;
    next();
    return;
  }
  res.status(401).send({ error: 'Not authorised.' });
};
