import {
  Badge,
  Button,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spacer,
  Tooltip,
  useBoolean,
  useColorMode,
  useColorModeValue,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import {
  faArchive,
  faChevronDown,
  faFireAlt,
  faHeadphones,
  faHeart,
  faMagic,
  faMoon,
  faMusic,
  faRectangleList,
  faSignInAlt,
  faSignOutAlt,
  faSun,
  faUserCircle
} from "@fortawesome/free-solid-svg-icons";
import { formatEther, getAddress } from "ethers";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import BasketButton from "@/components/header/basketButton";
import Notifications from "@/components/header/notifications";
import Icon from "@/components/icon";
import SearchBar from "@/components/searchBar";
import { useDispatch, useSelector } from "@/hooks";
import { logOut } from "@/state/user";
import { connectToWeb3 } from "@/state/web3";

const MenuBar = () => {
  const [isTop, setIsTop] = useBoolean(true);
  const { toggleColorMode } = useColorMode();
  const colorModeIcon = useColorModeValue(<Icon fixedWidth icon={faMoon} />, <Icon fixedWidth icon={faSun} />);
  const primaryButtonColor = useColorModeValue("yellow", "purple");

  const activeStyle = {
    "&.active": useColorModeValue(
      { backgroundColor: "orange.200", color: "orange.900" },
      { backgroundColor: "purple.200", color: "purple.900" }
    )
  };

  const navBackgroundColor = useColorModeValue(
    isTop ? "var(--chakra-colors-gray-50)" : "var(--chakra-colors-blackAlpha-200)",
    isTop ? "var(--chakra-colors-gray-900)" : "var(--chakra-colors-blackAlpha-500)"
  );

  const dispatch = useDispatch();
  const navRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const account = useSelector(state => state.web3.account);
  const accountShort = useSelector(state => state.web3.accountShort);
  const daiBalance = useSelector(state => state.web3.daiBalance);
  const isConnected = useSelector(state => state.web3.isConnected);
  const userAccount = useSelector(state => state.user.account);
  const userAccountShort = useSelector(state => state.user.accountShort);
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

  const toggleThemeButton = (
    <IconButton aria-label="Switch between light and dark modes." icon={colorModeIcon} onClick={toggleColorMode} />
  );

  return (
    <Wrap
      alignItems="center"
      backdropFilter="blur(10px)"
      backgroundColor={navBackgroundColor}
      borderBottomColor="gray.700"
      borderBottomWidth="1px"
      overflow="visible"
      p={4}
      position="sticky"
      ref={el => void (navRef.current = el)}
      spacing={4}
      top={0}
      transition="background-color 300ms ease-in-out"
      zIndex={1000}
    >
      <WrapItem>
        <SearchBar />
      </WrapItem>
      <WrapItem alignItems="center">
        <Button
          as={NavLink}
          fontStyle="italic"
          leftIcon={<Icon fixedWidth icon={faFireAlt} />}
          textTransform="uppercase"
          to={"/"}
          variant="ghost"
        >
          Gridfire
        </Button>
      </WrapItem>
      <Spacer />
      {!userAccount ? (
        <>
          <WrapItem>
            <Button
              as={NavLink}
              colorScheme={primaryButtonColor}
              leftIcon={<Icon fixedWidth icon={faSignInAlt} />}
              title="Click to log in."
              to={"/login"}
            >
              Log In
            </Button>
          </WrapItem>
          <WrapItem>{toggleThemeButton}</WrapItem>
        </>
      ) : (
        <>
          {isConnected ? (
            <>
              <WrapItem alignItems="center">
                <Tooltip label="Your active account's DAI balance.">
                  <Badge
                    alignItems="center"
                    colorScheme={getAddress(account) !== getAddress(userAccount) ? "yellow" : primaryButtonColor}
                    display="flex"
                    fontSize="md"
                    height={10}
                    px={4}
                    rounded="md"
                  >
                    ◈ {daiDisplayBalance}
                  </Badge>
                </Tooltip>
              </WrapItem>
              <WrapItem>
                <Tooltip label={`Your active web3 account. Click to view account details on the explorer.`}>
                  <Button
                    _hover={{ color: "initial", textDecoration: "none" }}
                    as={Link}
                    color="gray.400"
                    colorScheme={getAddress(account) !== getAddress(userAccount) ? "yellow" : undefined}
                    href={`https://arbiscan.io/address/${account}`}
                    isExternal
                    leftIcon={<Icon fixedWidth icon={faEthereum} />}
                    variant="ghost"
                  >
                    {accountShort}
                  </Button>
                </Tooltip>
              </WrapItem>
            </>
          ) : (
            <WrapItem>
              <Button leftIcon={<Icon fixedWidth icon={faEthereum} />} onClick={handleConnect}>
                Connect
              </Button>
            </WrapItem>
          )}
          <WrapItem>
            <BasketButton />
          </WrapItem>
          <WrapItem>
            <Notifications />
          </WrapItem>
          <WrapItem>
            <Menu>
              <MenuButton
                as={Button}
                colorScheme={primaryButtonColor}
                leftIcon={<Icon fixedWidth icon={faUserCircle} title={`Login account: ${userAccount}`} />}
                rightIcon={<Icon fixedWidth icon={faChevronDown} />}
              >
                {userAccountShort || "Dashboard"}
              </MenuButton>
              <MenuList overflow="hidden" py={0}>
                <MenuItem
                  as={NavLink}
                  icon={<Icon fixedWidth icon={faEthereum} />}
                  sx={activeStyle}
                  to={"/dashboard/payment"}
                >
                  Payment
                </MenuItem>
                <MenuItem as={NavLink} end icon={<Icon fixedWidth icon={faMusic} />} sx={activeStyle} to={"/dashboard"}>
                  Releases
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  icon={<Icon fixedWidth icon={faHeadphones} />}
                  sx={activeStyle}
                  to={"/dashboard/artists"}
                >
                  Artists
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  icon={<Icon fixedWidth icon={faRectangleList} />}
                  sx={activeStyle}
                  to={"/dashboard/activity"}
                >
                  Activity
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  icon={<Icon fixedWidth icon={faArchive} />}
                  sx={activeStyle}
                  to={"/dashboard/collection"}
                >
                  Collection
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  icon={<Icon fixedWidth icon={faHeart} />}
                  sx={activeStyle}
                  to={"/dashboard/favourites"}
                >
                  Faves
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  icon={<Icon fixedWidth icon={faMagic} />}
                  sx={activeStyle}
                  to={"/dashboard/wishlist"}
                >
                  List
                </MenuItem>
                <MenuDivider m={0} />
                <MenuItem icon={<Icon fixedWidth icon={faSignOutAlt} />} onClick={handleLogout}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          </WrapItem>
          <WrapItem>{toggleThemeButton}</WrapItem>
        </>
      )}
    </Wrap>
  );
};

export default MenuBar;
