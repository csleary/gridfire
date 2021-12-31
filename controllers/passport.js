import { nemp3Secret } from '../config/keys.js';
import User from '../models/User.js';
import crypto from 'crypto';
import { ethers } from 'ethers';
import passport from 'passport';
import passportCustom from 'passport-custom';
const CustomStrategy = passportCustom.Strategy;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id, '-__v -auth.password').exec();
  done(null, user);
});

const idHash = userToken => {
  const hash = crypto.createHash('sha256');
  return hash.update(userToken).update(nemp3Secret).digest('hex');
};

const loginWeb3 = async (req, done) => {
  try {
    const { address, message, signature } = req.body;
    const outputAddress = ethers.utils.verifyMessage(message, signature);

    if (address.toLowerCase() !== outputAddress.toLowerCase()) {
      return done(null, false, 'Could not verify signature.');
    }

    const existingUser = await User.findOne({ 'auth.account': address }).exec();

    if (existingUser) {
      await existingUser.updateOne({ 'auth.lastLogin': Date.now() }).exec();
      return done(null, existingUser);
    }

    const newUser = await User.create({
      auth: {
        account: address,
        idHash: idHash(address),
        lastLogin: Date.now()
      },
      paymentAddress: address
    });

    done(null, newUser);
  } catch (error) {
    done(error);
  }
};

passport.use('web3', new CustomStrategy(loginWeb3));
