import { Helmet } from 'react-helmet';
import React from 'react';
import styles from './support.module.css';

const Support = () => (
  <main className="container">
    <Helmet>
      <title>Support and FAQs</title>
      <meta name="description" content="Read answers to some of our most frequently asked questions." />
    </Helmet>
    <div className="row mb-5">
      <div className="col py-3 mb-4">
        <h2 className="text-center mt-4">FAQ</h2>
        <details className={styles.details}>
          <summary className={styles.summary}>What format do you use for downloads?</summary>
          <p>
            All audio downloads are high-quality V0 VBR mp3s by default (created using the LAME encoding library), with
            FLAC downloads also available from your collection page (in 16 or 24-bit formats, depending on the source
            files uploaded by the artist).
          </p>
        </details>
        <details className={styles.details}>
          <summary className={styles.summary}>What format do you use for streaming?</summary>
          <p>All source audio is automatically converted to 128kbps aac for streaming.</p>
        </details>
        <details className={styles.details}>
          <summary className={styles.summary}>What if I lose my download?</summary>
          <p>
            All successful purchases are stored in your account, accessible in your dashboard under the
            &lsquo;collection&rsquo; tab.
          </p>
        </details>
        <details className={styles.details}>
          <summary className={styles.summary}>I&rsquo;ve found a bug! How can I report it?</summary>
          <p>
            Please send us as much detail as you can via the contact form, and we&rsquo;ll address it as soon as
            possible. Thanks!
          </p>
        </details>
        <p>
          Still need help? Please send us a message via the contact form and we&rsquo;ll do what we can to assist you.
        </p>
      </div>
    </div>
  </main>
);

export default Support;
