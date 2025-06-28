import { getUser } from "@gridfire/api/controllers/userController";
import { keccak256, toUtf8Bytes } from "ethers";
import { Router } from "express";
import { randomBytes } from "node:crypto";
import passport from "passport";

const { NODE_ENV } = process.env;
const router = Router();

router.get("/web3", (req, res) => {
  const { address } = req.query;
  const { hostname } = req;
  const protocol = req.get("x-forwarded-proto") || req.protocol;
  const domain = `${protocol}://${hostname}`;
  const nonce = randomBytes(4).toString("hex");
  const date = new Date().toISOString();

  const siweMessage = `gridfire.app wants you to sign in with your Ethereum account:\n${address}\n\nWelcome to Gridfire!\n\nURI: ${domain}/login\nVersion: 1\nChain ID: 42161\nNonce: ${nonce}\nIssued At: ${date}`;

  const messageHash = keccak256(toUtf8Bytes(siweMessage));

  res.cookie("web3Login", JSON.stringify({ messageHash, address }), {
    httpOnly: true,
    maxAge: 1000 * 60 * 3,
    sameSite: "strict",
    secure: NODE_ENV === "production",
    signed: true
  });

  const message = `0x${Buffer.from(siweMessage).toString("hex")}`;
  res.json({ message });
});

router.post("/web3", (req, res, next) =>
  passport.authenticate(
    "web3",
    (authError: any, user: Express.User | false | null, info: object | string | Array<string | undefined>) => {
      res.clearCookie("web3Login");
      if (user === false) return res.status(401).json({ error: info });
      if (authError) return res.status(401).json({ error: authError.message });
      if (!user) return res.status(400).json({ error: info });

      req.logIn(user, async logInError => {
        if (logInError) return res.status(400).json({ error: logInError.message });
        const userWithMeta = await getUser(user._id);
        res.json({ user: userWithMeta });
      });
    }
  )(req, res, next)
);

router.get("/logout", (req, res, next) => {
  req.logout(next);
  delete req.user;
  res.sendStatus(200);
});

export default router;
