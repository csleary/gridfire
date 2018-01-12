import React from 'react';
import QRCode from 'qrcode.react';
import '../style/qrcode.css';

const QrCode = props => {
  const v = process.env.REACT_APP_NEM_NETWORK === 'mainnet' ? 2 : 1;
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
    <div className="text-center qrcode">
      <QRCode
        value={JSON.stringify(paymentData)}
        size={256}
        fgColor={'#333333'}
        bgColor={'#f8f8f8'}
        level={'M'}
      />
    </div>
  );
};

export default QrCode;
