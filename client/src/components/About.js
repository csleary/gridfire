import React from 'react';

const About = () => (
  <main className="container">
    <div className="row">
      <div className="col">
        <h2 className="text-center">About NEMp3</h2>
      </div>
    </div>
    <div className="row">
      <div className="col">
        <p>
          NEMp3 is a music download store that uses the{' '}
          <a href="https://nem.io/">NEM blockchain</a> and cryptocurrency (XEM)
          for payment, allowing artists to receive payments from fans in a
          matter of seconds, without needing to rely on an intermediating
          payment processor.
        </p>
        <p>
          Artists set a price for their releases in USD, and we convert this to
          the equivalent market value in XEM automatically. Fans may purchase
          using one of the NEM wallets, either via a QR code with the mobile
          wallet, or manually entering payment using the Nanowallet desktop
          wallet.
        </p>
      </div>
      <div className="col">
        <p>
          At present, NEMp3 is entirely free to use, with artists receiving 100%
          of payments, paid directly from fan to artist. In the future, we
          anticipate charging a small cut of payments received, in order to
          support the site&rsquo;s running expenses.
        </p>
      </div>
    </div>
  </main>
);

export default About;
