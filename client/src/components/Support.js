import React from 'react';
import '../style/support.css';

const Support = () => (
  <main className="container">
    <div className="row mb-5">
      <div className="col py-3 mb-4">
        <h2 className="text-center red mt-4">FAQ</h2>
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
          <summary>
            I&rsquo;ve not used NEM before. Which wallet should I use?
          </summary>
          <p>
            There are two official wallets, an Electron-based desktop client
            called NanoWallet, and an Android/iOS Mobile Wallet. More
            information on both can be found on the{' '}
            <a href="https://www.nem.io/install.html">NEM site</a>.
          </p>
        </details>
        <details>
          <summary>What format do you use for downloads?</summary>
          <p>
            All audio downloads are lossless wav or aif, depending on the source
            files uploaded by the artist.
          </p>
        </details>
        <details>
          <summary>What format do you use for streaming?</summary>
          <p>
            All source audio is automatically converted to 128kbps aac for
            streaming.
          </p>
        </details>
        <details>
          <summary>What if I lose my download?</summary>
          <p>
            All successful purchases are stored in your account, accessible in
            your dashboard under the &lsquo;collection&rsquo; tab.
          </p>
        </details>
        <details>
          <summary>Why the name &lsquo;NEMp3&rsquo;?</summary>
          <p>
            The name is a holdover from the initial proof of concept, which
            offered only mp3s. And so a terrible pun was born. It&rsquo;s also a
            nod towards mp3.com, which was one of the earliest popular social
            networking music sites on which I cut my teeth as an artist.
          </p>
        </details>
        <details>
          <summary>I&rsquo;ve found a bug! How can I report it?</summary>
          <p>
            Excellent! The best way would be to log an issue on{' '}
            <a href="https://github.com/csleary/nemp3v2/issues">Github</a>, to
            keep everything organised with a history of all issues that have
            either been addressed or remain outstanding. But you can also ping
            me on Twitter, or drop a note through the contact form. Thanks!
          </p>
        </details>
      </div>
    </div>
  </main>
);

export default Support;
