# nemp3: A NEM cryptocurrency-powered music download store

- Purchase mp3s and lossless FLAC music using the NEM cryptocurrency, pegged to USD prices via the public Binance exchange API.
- Streamed audio via transcoded fragmented AAC files, using a custom Media Source Extensions-based audio player, for bandwidth-frugal streaming.
- Scan QR codes to pay via a supported mobile wallet.
- Payments are made directly from fan to artist accounts. The app is entirely non-custodial, tracking payments via unique purchase codes embedded with each purchase.
- Artists are required to purchase a utility token (nemp3:credits) to use the platform.
- Audio files are stored in an Amazon S3 bucket in FLAC/AAC/MP3 format.
- Log in either with a local email/password combo, or via Google's OAuth service (Google, Spotify and Twitter SSOs).
- Uses RabbitMQ with a worker pool for non thread-blocking audio/artwork file transcoding/zipping.
- Image processing and optimisation via the Sharp module.
- A MERN-stack SPA, set up with a local MongoDB Docker container by default as part of a Docker Compose container group.
- DKIM email key support for reliable contact form email, less likely to be flagged for spam.

## Customisation

To run your own app, you will need to amend the following environmental variables (.env files supported):

Client app build-time env vars:

- REACT_APP_NODE_ENV (development/production)
- REACT_APP_CLOUDFRONT (your cloudfront URL host, .e.g my-subdomain.cloudfront.net)
- REACT_APP_NEM_NETWORK (testnet/mainnet)
- REACT_APP_RECAPTCHA_SITE_KEY from Google, for sign-up and contact form recaptcha support.

Server env vars (non-exhaustive, see current config/ for examples/defaults):

- AWS_REGION - your S3 Bucket region.
- BENTO4_DIR - path to the bento4 executable for creating fragmented AAC files.
- BUCKET_IMG - your S3 image Bucket name.
- BUCKET_MP3 - your S3 mp3 Bucket name.
- BUCKET_OPT - your streaming audio Bucket name.
- BUCKET_SRC - your FLAC/source uploads Bucket name.
- NEM_NODES - a list of nodes to use for NEM purchase-checking (official nodes recommended).
- NEM_NETWORK_ID - NEM network ID (number, e.g. nem.model.network.data.mainnet.id using the NEM SDK).
- PAYMENT_ADDRESS - a NEM payment address for supporting the site.
- PRIV_KEY - private key of token hot wallet to send tokens out to users. Recommended that this be a separate microservice located on a different server, securely consuming the RabbitMQ queue for token disbursement. Or if on the same server, use a separate wallet to the main payment account, with a small amount of tokens at any time.
- QUEUE_ARTWORK - the RabbitMQ queue name for artwork processing workers.
- QUEUE_CREDITS - as above for credits disbursement workers.
- QUEUE_TRANSCODE - as above for the audio file transcoding workers.
- RABBIT_HOST - RabbitMQ host name.
- SOCKET_HOST - socket.io host name.
- TEMP_PATH - local path name for temp files (uploads, processing).

Other vars should be pretty self-explanatory (oauth credentials etc.)
