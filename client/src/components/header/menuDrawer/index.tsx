import {
  Badge,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Flex,
  IconButton,
  Link,
  Spacer,
  VStack,
  Wrap,
  WrapItem,
  useBoolean,
  useColorMode,
  useColorModeValue,
  useDisclosure
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { NavLink, useNavigate } from "react-router-dom";
import {
  faArchive,
  faBars,
  faFireAlt,
  faHeadphonesAlt,
  faHeart,
  faMagic,
  faRectangleList,
  faSignInAlt,
  faSignOutAlt,
  faUserCircle
} from "@fortawesome/free-solid-svg-icons";
import { formatEther, getAddress } from "ethers";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "hooks";
import BasketButton from "components/header/basketButton";
import Notifications from "components/header/notifications";
import SearchBar from "components/searchBar";
import Icon from "components/icon";
import { connectToWeb3 } from "state/web3";
import debounce from "lodash.debounce";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { logOut } from "state/user";

const MenuDrawer = () => {
  const [isTop, setIsTop] = useBoolean(true);
  const { toggleColorMode } = useColorMode();
  const colorModeIcon = useColorModeValue(<MoonIcon />, <SunIcon />);
  const colorModeText = useColorModeValue("Dark Mode", "Light Mode");
  const navBgLightColor = isTop ? "var(--chakra-colors-gray-50)" : "var(--chakra-colors-blackAlpha-200)";
  const navBgDarkColor = isTop ? "var(--chakra-colors-gray-900)" : "var(--chakra-colors-blackAlpha-500)";
  const navBackgroundColor = useColorModeValue(navBgLightColor, navBgDarkColor);
  const primaryButtonColor = useColorModeValue("yellow", "purple");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useDispatch();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>();
  const navigate = useNavigate();
  const userAccount = useSelector(state => state.user.account);
  const userAccountShort = useSelector(state => state.user.accountShort);
  const account = useSelector(state => state.web3.account);
  const accountShort = useSelector(state => state.web3.accountShort);
  const daiBalance = useSelector(state => state.web3.daiBalance);
  const isConnected = useSelector(state => state.web3.isConnected);
  const daiDisplayBalance = Number.parseFloat(formatEther(daiBalance)).toFixed(2);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleScroll = useCallback(
    debounce(
      () => {
        const navbarPos = navRef.current?.offsetTop ?? 0;
        if (navbarPos === 0) return void setIsTop.on();
        setIsTop.off();
      },
      100,
      { leading: true }
    ),
    [setIsTop]
  );

  useEffect(() => {
    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleLogout = () => {
    dispatch(logOut()).then(() => navigate("/"));
  };

  const handleConnect = async () => {
    await dispatch(connectToWeb3());
  };

  return (
    <>
      <Wrap
        spacing={2}
        alignItems="center"
        backdropFilter="blur(10px)"
        backgroundColor={navBackgroundColor}
        overflow="visible"
        p={2}
        position="sticky"
        ref={el => (navRef.current = el)}
        top={0}
        transition="background-color 300ms ease-in-out"
        zIndex={1000}
      >
        <WrapItem alignItems="center">
          <Button
            as={NavLink}
            to={"/"}
            fontStyle="italic"
            leftIcon={<Icon icon={faFireAlt} />}
            textTransform="uppercase"
            variant="ghost"
          >
            GridFire
          </Button>
        </WrapItem>
        <Spacer />
        <WrapItem>
          <BasketButton />
        </WrapItem>
        <WrapItem>
          <Notifications />
        </WrapItem>
        <WrapItem>
          <IconButton aria-label="Open the menu." icon={<Icon icon={faBars} />} onClick={onOpen} ref={btnRef} />
        </WrapItem>
      </Wrap>
      <Drawer finalFocusRef={btnRef} isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader color="gray.400" p={4}>
            <Flex alignItems="center">
              <Icon icon={faUserCircle} title={`Login account: ${userAccount}`} mr={2} />
              {userAccountShort || "Dashboard"}
            </Flex>
          </DrawerHeader>
          <DrawerBody p={4}>
            <VStack alignItems="flex-start" spacing={4}>
              {!userAccount ? (
                <>
                  <Button
                    as={NavLink}
                    colorScheme={primaryButtonColor}
                    to={"/login"}
                    leftIcon={<Icon icon={faSignInAlt} fixedWidth mr={2} />}
                    title="Click to log in."
                  >
                    Log In
                  </Button>
                  <Divider />
                  <Button
                    aria-label="Switch between light and dark modes."
                    leftIcon={colorModeIcon}
                    onClick={toggleColorMode}
                    variant="link"
                  >
                    {colorModeText}
                  </Button>
                </>
              ) : (
                <>
                  {isConnected ? (
                    <Flex alignItems="center">
                      <Button
                        _hover={{ textDecoration: "none" }}
                        as={Link}
                        colorScheme={getAddress(account) !== getAddress(userAccount) ? "yellow" : undefined}
                        height="unset"
                        href={`https://arbiscan.io/address/${account}`}
                        leftIcon={<Icon icon={faEthereum} fixedWidth />}
                        isExternal
                        mr={2}
                        variant="link"
                      >
                        {accountShort}
                      </Button>
                      <Badge
                        colorScheme={getAddress(account) !== getAddress(userAccount) ? "yellow" : primaryButtonColor}
                        fontSize="sm"
                        py={0}
                      >
                        ◈ {daiDisplayBalance}
                      </Badge>
                    </Flex>
                  ) : (
                    <Button
                      colorScheme={primaryButtonColor}
                      justifyContent="flex-start"
                      leftIcon={<Icon icon={faEthereum} fixedWidth />}
                      onClick={handleConnect}
                    >
                      Connect
                    </Button>
                  )}
                  <Button
                    _hover={{ textDecoration: "none" }}
                    as={NavLink}
                    to={"/dashboard/payment"}
                    justifyContent="flex-start"
                    leftIcon={<Icon icon={faEthereum} fixedWidth />}
                    variant="link"
                  >
                    Payment
                  </Button>
                  <Button
                    _hover={{ textDecoration: "none" }}
                    as={NavLink}
                    to={"/dashboard"}
                    end
                    leftIcon={<Icon icon={faHeadphonesAlt} fixedWidth />}
                    variant="link"
                  >
                    Releases
                  </Button>
                  <Button
                    _hover={{ textDecoration: "none" }}
                    as={NavLink}
                    to={"/dashboard/artists"}
                    leftIcon={<Icon icon={faArchive} fixedWidth />}
                    variant="link"
                  >
                    Artists
                  </Button>
                  <Button
                    _hover={{ textDecoration: "none" }}
                    as={NavLink}
                    to={"/dashboard/activity"}
                    leftIcon={<Icon icon={faRectangleList} fixedWidth />}
                    variant="link"
                  >
                    Activity
                  </Button>
                  <Button
                    _hover={{ textDecoration: "none" }}
                    as={NavLink}
                    to={"/dashboard/collection"}
                    leftIcon={<Icon icon={faArchive} fixedWidth />}
                    variant="link"
                  >
                    Collection
                  </Button>
                  <Button
                    _hover={{ textDecoration: "none" }}
                    as={NavLink}
                    to={"/dashboard/favourites"}
                    leftIcon={<Icon icon={faHeart} fixedWidth />}
                    variant="link"
                  >
                    Faves
                  </Button>
                  <Button
                    _hover={{ textDecoration: "none" }}
                    as={NavLink}
                    to={"/dashboard/wishlist"}
                    leftIcon={<Icon icon={faMagic} fixedWidth />}
                    variant="link"
                  >
                    List
                  </Button>
                  <SearchBar variant="link" />
                  <Divider />
                  <Button
                    _hover={{ textDecoration: "none" }}
                    aria-label="Switch between light and dark modes."
                    leftIcon={colorModeIcon}
                    onClick={toggleColorMode}
                    variant="link"
                  >
                    {colorModeText}
                  </Button>
                  <Divider />
                  <Button
                    _hover={{ textDecoration: "none" }}
                    aria-label="Sign out of GridFire."
                    leftIcon={<Icon icon={faSignOutAlt} fixedWidth />}
                    onClick={handleLogout}
                    variant="link"
                  >
                    Sign Out
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter p={4}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MenuDrawer;
