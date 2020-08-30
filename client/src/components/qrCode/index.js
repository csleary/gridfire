import PropTypes from 'prop-types';
import QRCode from 'qrcode.react';
import React from 'react';

const QrCode = ({ bgColor = '#22232a', idHash = '', paymentAddress, price }) => {
  const v = process.env.REACT_APP_NEM_NETWORK === 'testnet' ? 1 : 2;
  const paymentData = {
    v,
    type: 2,
    data: {
      addr: paymentAddress?.replace(/-/g, ''),
      amount: price * 10 ** 6,
      msg: idHash
    }
  };

  return <QRCode value={JSON.stringify(paymentData)} size={256} fgColor={'#f0f0f1'} bgColor={bgColor} level={'M'} />;
};

QrCode.propTypes = {
  bgColor: PropTypes.string,
  idHash: PropTypes.string,
  paymentAddress: PropTypes.string,
  price: PropTypes.string
};

export default QrCode;
