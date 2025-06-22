import { useMediaQuery } from "@chakra-ui/react";
import MenuBar from "./menuBar";
import MenuDrawer from "./menuDrawer";

const Header = () => {
  const [isSmallScreen] = useMediaQuery([
    "(max-device-width: 736px)",
    "(-webkit-min-device-pixel-ratio: 2)",
    "(screen)"
  ]);

  if (isSmallScreen) {
    return <MenuDrawer />;
  }

  return <MenuBar />;
};

export default Header;
