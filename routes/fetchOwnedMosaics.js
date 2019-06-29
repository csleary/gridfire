const nem = require('nem-sdk').default;
const { NEM_NODE } = require('./constants');

module.exports = paymentAddress =>
  new Promise(async resolve => {
    const endpoint = nem.model.objects.create('endpoint')(
      NEM_NODE,
      nem.model.nodes.defaultPort
    );

    const mosaics = await nem.com.requests.account.mosaics.owned(
      endpoint,
      paymentAddress
    );

    mosaics.data.forEach(mosaic => {
      if (
        mosaic.mosaicId.namespaceId === 'nemp3' &&
        mosaic.mosaicId.name === 'credit'
      ) {
        resolve(mosaic.quantity);
      }
    });
    resolve(0);
  });
