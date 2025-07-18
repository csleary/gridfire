import { chakra, shouldForwardProp } from "@chakra-ui/react";
import { isValidMotionProp, motion } from "framer-motion";

const ScaleFadeCustom = chakra(motion.div, {
  shouldForwardProp: prop => isValidMotionProp(prop) || shouldForwardProp(prop)
});

const ScaleFade = ({ children }: { children: React.ReactNode }) => (
  <ScaleFadeCustom
    animate={{ opacity: 1, scale: 1 }}
    initial={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: "0.5", ease: "easeOut" }}
  >
    {children}
  </ScaleFadeCustom>
);

export default ScaleFade;
