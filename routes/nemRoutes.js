const { fetchXemPrice, fetchXemPriceBinance } = require('../controllers/nemController');

module.exports = app => {
  app.get('/api/nem/price', async (req, res) => {
    try {
      const xemPriceUsd = await fetchXemPriceBinance();
      res.send({ xemPriceUsd });
    } catch (error) {
      try {
        const xemPriceUsd = await fetchXemPrice();
        res.send({ xemPriceUsd });
      } catch (backupError) {
        if ((error.data && error.data === 'error code: 1006') || backupError)
          res.status(500).send({ error: 'Price data currently unavailable.' });
        else res.status(500).send({ error: error.message });
      }
    }
  });
};
