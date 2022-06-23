import { ethers } from "ethers";
import express from "express";
import { getUser } from "gridfire/controllers/userController.js";
import passport from "passport";
import { randomUUID } from "crypto";

const { NODE_ENV } = process.env;
const router = express.Router();

router.get("/web3", (req, res) => {
  const { keccak256, toUtf8Bytes, verifyMessage } = ethers.utils;
  const nonce = randomUUID();
  const { address } = req.query;

  const message = `Hi! Welcome to GridFire.

Using your Ether wallet you can safely and securely sign in, without needing an email or password. 'Signing' a message proves you are the owner of the account. This is a free process, costing you no ether, and doesn't require access to the blockchain.

We've included a unique, randomly-generated code below to ensure that your signature is recent.

${nonce}`;

  const messageHash = keccak256(toUtf8Bytes(message));

  res.cookie("web3Login", JSON.stringify({ messageHash, address }), {
    httpOnly: true,
    maxAge: 1000 * 60 * 3,
    sameSite: "Strict",
    secure: NODE_ENV === "production",
    signed: true
  });

  res.json({ message });
});

router.post("/web3", (req, res, next) =>
  passport.authenticate("web3", (authError, user, info) => {
    res.clearCookie("web3Login");
    if (user === false) return res.status(401).json({ error: info });
    if (authError) return res.status(401).json({ error: authError.message });

    req.logIn(user, async logInError => {
      if (logInError) return res.status(400).json({ error: logInError.message });
      const userWithMeta = await getUser(user._id);
      res.json({ user: userWithMeta });
    });
  })(req, res, next)
);

router.get("/logout", (req, res) => {
  req.logout();
  delete req.user;
  res.sendStatus(200);
});

export default router;
