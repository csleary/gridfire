import QRCode from 'qrcode.react';
import React from 'react';
import styles from './about.module.css';

const address = 'NBQGRG-QTZ4A4-6TKN7O-SOKE62-XGL6OW-EEHAIX-ZQPD';
const paymentData = {
  v: 2,
  type: 2,
  data: {
    addr: address.replace(/-/g, ''),
    amount: 0,
    msg: 'nemp3 Donation'
  }
};

const About = () => (
  <main className="container">
    <div className="row">
      <div className="col py-3 mb-4">
        <h2 className="text-center mt-4">About nemp3</h2>
        <p>
          nemp3 is a music download store that uses the{' '}
          <a href="https://nem.io/">NEM</a> blockchain and cryptocurrency (XEM)
          for payment, allowing artists to receive direct payments from fans in
          a matter of seconds, without an intermediary payment processor.
        </p>
        <p>
          Artists set a price for their releases in USD, and we convert this to
          the equivalent market value in XEM automatically. Fans can make
          purchases using one of the NEM wallets, either via a QR code with a
          mobile wallet, or by manually entering payment details using the
          Nanowallet desktop wallet.
        </p>
        <p>
          Artists receive 100% of fan payments, paid directly to their own
          accounts. Of course, there are data hosting and server costs to pay,
          so we ask artists to purchase credit to help cover the hosting and
          bandwidth fees.
        </p>
        <p>
          Donations to help maintain the project and cover expenses are also
          very much appreciated. Thank you!
        </p>
        <div className="text-center mt-5">
          <QRCode
            value={JSON.stringify(paymentData)}
            size={192}
            fgColor={'#f0f0f1'}
            bgColor={'#22232a'}
            level={'M'}
          />
          <h6 className="mt-2">
            Namespace: <span className={styles.namespace}>nemp3</span>
          </h6>
          <h6>{address}</h6>
        </div>
      </div>
    </div>
  </main>
);

export default About;
