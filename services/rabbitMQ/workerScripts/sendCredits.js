const { parentPort, workerData } = require('worker_threads');
const { findNode } = require('../../../controllers/nemController');
const { privKey } = require('../../../config/keys');
const { NEM_NETWORK_ID, PRODUCTS } = require('../../../config/constants');
const nem = require('nem-sdk').default;
const { sendEmail } = require('../../../controllers/emailController');

const sendCredits = async () => {
  const { sender, sku, userId } = workerData;
  const quantity = PRODUCTS.find(product => product.sku === sku).quantity;

  const node = await findNode().catch(error => {
    throw new Error(error);
  });

  try {
    const { endpoint } = node;
    const common = nem.model.objects.create('common')('', privKey);
    const mosaicDefinitionMetaDataPair = nem.model.objects.get('mosaicDefinitionMetaDataPair');
    const transferTransaction = nem.model.objects.create('transferTransaction')(sender, 1);
    const mosaicAttachment = nem.model.objects.create('mosaicAttachment')('nemp3', 'credits', quantity);
    transferTransaction.mosaics.push(mosaicAttachment);

    const definitionArray = await nem.com.requests.namespace.mosaicDefinitions(
      endpoint,
      mosaicAttachment.mosaicId.namespaceId
    );

    const neededDefinition = nem.utils.helpers.searchMosaicDefinitionArray(definitionArray.data, ['credits']);
    const fullMosaicName = nem.utils.format.mosaicIdToName(mosaicAttachment.mosaicId);

    if (undefined === neededDefinition[fullMosaicName]) {
      throw new Error('Mosaic not found!');
    }

    const { supply } = await nem.com.requests.mosaic.supply(endpoint, fullMosaicName);
    mosaicDefinitionMetaDataPair[fullMosaicName] = {};
    mosaicDefinitionMetaDataPair[fullMosaicName].mosaicDefinition = neededDefinition[fullMosaicName];
    mosaicDefinitionMetaDataPair[fullMosaicName].supply = supply;

    const transactionEntity = nem.model.transactions.prepare('mosaicTransferTransaction')(
      common,
      transferTransaction,
      mosaicDefinitionMetaDataPair,
      NEM_NETWORK_ID
    );

    const { receiveTimeStamp } = await nem.com.requests.chain.time(endpoint);
    const timeStamp = Math.floor(receiveTimeStamp / 1000);
    transactionEntity.timeStamp = timeStamp;
    const due = 60;
    transactionEntity.deadline = timeStamp + due * 60;
    const status = await nem.model.transactions.send(common, transactionEntity, endpoint);

    const body = `
Credits purchased: ${quantity} (${sku})
Purchase address: ${sender}
User ID: ${userId}
Status:

${JSON.stringify(status, null, 2)}
`;

    sendEmail('mail@nemp3.app', 'nemp3 Credits Purchase', body);

    if (status.message === 'SUCCESS') {
      parentPort.postMessage({ message: '🙌 Credits sent!', userId });
    }
  } catch (error) {
    console.log(error);
  }
};

sendCredits();
