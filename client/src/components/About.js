import React from 'react';

const About = () => (
  <main className="container">
    <div className="row">
      <div className="col py-3 mb-4">
        <h2 className="text-center red mt-4">About NEMp3</h2>
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
          using one of the NEM wallets, either via a QR code with a mobile
          wallet, or manually entering payment using the Nanowallet desktop
          wallet.
        </p>
        <p>
          At present, NEMp3 is entirely free to use, with artists receiving 100%
          of payments, paid directly from fan to artist. Of course, there are
          data hosting and server costs to pay, so we are currently exploring
          ways of supporting the platform without either compromising on artist
          or fan privacy, or the direct link between fan and artist.
        </p>
      </div>
    </div>
  </main>
);

export default About;
