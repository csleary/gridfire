import { Strategy as PassportCustom, VerifyCallback } from "passport-custom";
import { getAddress, keccak256, toUtf8Bytes, verifyMessage } from "ethers";
import { IUser } from "gridfire/models/User.js";
import mongoose from "mongoose";
import passport, { AuthenticateCallback } from "passport";

const User = mongoose.model("User");

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (userId, done) => {
  const user = (await User.findById(userId, "-__v").exec()) as Express.User;
  done(null, user);
});

const loginWeb3: VerifyCallback = async (req, done: AuthenticateCallback) => {
  try {
    const { address, messageHash } = JSON.parse(req.signedCookies.web3Login);
    const { message, signature } = req.body;

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
      emailAddress: "",
      lastLogin: Date.now(),
      paymentAddress: getAddress(address),
      username: ""
    });

    done(null, newUser);
  } catch (error) {
    console.log(error);
    done(error);
  }
};

passport.use("web3", new PassportCustom(loginWeb3));
