import User from "../models/User.js";
import crypto from "crypto";
import { utils } from "ethers";
import passport from "passport";
import passportCustom from "passport-custom";

const CustomStrategy = passportCustom.Strategy;

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (userId, done) => {
  const user = await User.findById(userId, "-__v").exec();
  done(null, user);
});

const createKey = userToken =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString("hex");
    crypto.scrypt(userToken, salt, 16, { maxmem: 64 * 1024 * 1024 }, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(derivedKey.toString("hex"));
    });
  });

const loginWeb3 = async (req, done) => {
  try {
    const { address, messageHash } = JSON.parse(req.signedCookies.web3Login);
    const { message, signature } = req.body;
    const { getAddress, keccak256, toUtf8Bytes, verifyMessage } = utils;

    if (keccak256(toUtf8Bytes(message)) !== messageHash) {
      return done(null, false, "Could not verify signature.");
    }

    const outputAddress = verifyMessage(message, signature);

    if (getAddress(address) !== getAddress(outputAddress)) {
      return done(null, false, "Could not verify signature.");
    }

    const existingUser = await User.findOne({ account: getAddress(address) }).exec();

    if (existingUser) {
      await existingUser.updateOne({ lastLogin: Date.now() }).exec();
      return done(null, existingUser);
    }

    const newUser = await User.create({
      account: getAddress(address),
      key: await createKey(address),
      lastLogin: Date.now(),
      paymentAddress: getAddress(address)
    });

    done(null, newUser);
  } catch (error) {
    console.log(error);
    done(error);
  }
};

passport.use("web3", new CustomStrategy(loginWeb3));
