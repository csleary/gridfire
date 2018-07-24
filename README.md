# NEMp3: A NEM cryptocurrency-based music download store

Purchase lossless music with the NEM cryptocurrency. Essentially a stripped-down crypto Bandcamp!

* A MERN-stack single-page app.
* Files are stored on Amazon S3, with stream-friendly aac files transcoded from the uncompressed source audio uploads.
* Payment is facilitated by the NEM blockchain/cryptocurrency (XEM), checking payments directly from buyer to seller (so just a single network fee is incurred by the buyer).
* Includes a serviceable HTML Audio player component.
* Log in either with a trusty email/password combo, or via Google's OAuth service.
* Currently free for musicians! No cut from your album price is taken (aside from NEM network fees, of course).

# DIY

If you wish to try the app locally (perhaps to adapt for your own store etc.), please `git clone/pull...`, `npm install`, then run `npm run dev` to get it up and running in dev mode.

You'll need a MongoDB istance running, with suitable credentials put in the /config/dev.js file (copy this over from the prod.js file and fill them in to suit you).

For production, build a webpack bundle in the client folder by running `npm run build` (if doing this on the server, the Express API will serve the files out of the resulting client/build folder).

If you do try it and get stuck, please feel free to ping me.

# Issues

Artists and fans/users: if you encounter any issues while using the app, please file and issue here and I'll tend to it as soon as I can.

Contributors: If you see an issue you'd like to have a crack at, or notice any bugs in general, please feel free to tackle and send me a PR.
