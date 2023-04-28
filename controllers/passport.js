import { getAddress, keccak256, toUtf8Bytes, verifyMessage } from "ethers";
import mongoose from "mongoose";
import passport from "passport";
import passportCustom from "passport-custom";

const CustomStrategy = passportCustom.Strategy;
const User = mongoose.model("User");

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (userId, done) => {
  const user = await User.findById(userId, "-__v").exec();
  done(null, user);
});

const loginWeb3 = async (req, done) => {
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

passport.use("web3", new CustomStrategy(loginWeb3));
