import { Helmet } from 'react-helmet';
import React from 'react';

const About = () => (
  <main className="container">
    <Helmet>
      <title>About GridFire</title>
      <meta name="description" content="Learn about the GridFire music streaming and download platform." />
    </Helmet>
    <div className="row">
      <div className="col py-3 mb-4">
        <h2 className="text-center mt-4">About GridFire</h2>
        <p>
          GridFire is a music download store that uses the Arbitrum blockchain and Ether cryptocurrency (ETH) for
          payment, allowing artists to receive payments directly from fans, without an intermediary payment processor.
        </p>
        <p>
          Artists set a price for their releases in USD, and we convert this to the equivalent market value in XEM
          automatically. Fans can make purchases using Metamask.
        </p>
      </div>
    </div>
  </main>
);

export default About;
