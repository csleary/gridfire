import React from 'react';
import '../style/support.css';

const Support = () => (
  <main className="container">
    <div className="row">
      <div className="col">
        <h2 className="text-center red">FAQ</h2>
        <details>
          <summary>Where can I buy some XEM?</summary>
          <p>
            The larger exchanges such as{' '}
            <a href="https://www.binance.com">Binance</a>,{' '}
            <a href="https://bittrex.com/">Bittrex</a> or{' '}
            <a href="https://www.poloniex.com/">Poloniex</a> would be the most
            cost effective, though XEM is usually traded against Bitcoin, so you
            would need to either purchase or trade currency for Bitcoin first,
            then trade it for XEM.
          </p>
          <p>
            If you would rather just quickly buy a small amount of XEM using
            your credit/debit card, you could try a service like Changelly or
            Shapeshift (which I believe you can do inside the main NEM Wallet),
            though this may come at the price of larger fees. In all cases, it
            will be more cost effective exchanging a larger single sum than
            multiple smaller sums.
          </p>
          <p>
            To turn your XEM earnings back into your native currency, you would
            need to use an exhange with the necessary fiat pairing and
            withdrawal ability, e.g. Kraken for USD (via BTC), Bitstamp for EUR
            (via BTC), Zaif for JPY (direct XEM/JPY pair).
          </p>
        </details>
        <details>
          <summary>What format do you use for downloads?</summary>
          <p>
            All audio downloads are lossless wav or aif, depending on the source
            files uploaded by the artist. Audio is converted to aac for
            streaming.
          </p>
          <p>
            That&rsquo;s right, we&rsquo;re called NEMp3 and yet we don&rsquo;t
            sell mp3s. The name is a holdover from the initial proof of concept,
            which offered only mp3s.
          </p>
        </details>
        <details>
          <summary>
            I&rsquo;ve not used NEM before &ndash; which wallet should I use?
          </summary>
          <p>
            There are two official wallets, a browser-based desktop client
            called Nano Wallet, and an Android/iOS Mobile Wallet. More
            information on both can be found on the{' '}
            <a href="https://www.nem.io/install.html">NEM site</a>.
          </p>
        </details>
        <details>
          <summary>What if I lose my download?</summary>
          <p>
            All successful purchases are stored in your account, and can be
            re-downloaded by revisiting the album page again. In the future, we
            will add a dashboard component showing your purchase history.
          </p>
        </details>
      </div>
    </div>
  </main>
);

export default Support;
