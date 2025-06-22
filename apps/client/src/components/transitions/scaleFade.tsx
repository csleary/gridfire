import { chakra, shouldForwardProp } from "@chakra-ui/react";
import { motion, isValidMotionProp } from "framer-motion";

const ScaleFadeCustom = chakra(motion.div, {
  shouldForwardProp: prop => isValidMotionProp(prop) || shouldForwardProp(prop)
});

const ScaleFade = ({ children }: { children: React.ReactNode }) => (
  <ScaleFadeCustom
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: "0.5", ease: "easeOut" }}
  >
    {children}
  </ScaleFadeCustom>
);

export default ScaleFade;
