import '../../style/qrcode.css';
import QRCode from 'qrcode.react';
import React from 'react';

const QrCode = props => {
  const v = process.env.REACT_APP_NEM_NETWORK === 'testnet' ? 1 : 2;
  const paymentData = {
    v,
    type: 2,
    data: {
      addr: props.paymentAddress.replace(/-/g, ''),
      amount: props.price * 10 ** 6,
      msg: props.idHash
    }
  };

  return (
    <QRCode
      value={JSON.stringify(paymentData)}
      size={256}
      fgColor={'#f0f0f1'}
      bgColor={'#22232a'}
      level={'M'}
    />
  );
};

export default QrCode;
