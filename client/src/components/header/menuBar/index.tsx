import {
  Badge,
  Button,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Spacer,
  Tooltip,
  Wrap,
  WrapItem,
  useBoolean,
  useColorMode,
  useColorModeValue
} from "@chakra-ui/react";
import { ChevronDownIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { NavLink, useNavigate } from "react-router-dom";
import {
  faArchive,
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
import Icon from "components/icon";
import SearchBar from "components/searchBar";
import { connectToWeb3 } from "state/web3";
import debounce from "lodash.debounce";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { logOut } from "state/user";
import { shallowEqual } from "react-redux";

const MenuBar = () => {
  const [isTop, setIsTop] = useBoolean(true);
  const { toggleColorMode } = useColorMode();
  const colorModeIcon = useColorModeValue(<MoonIcon />, <SunIcon />);
  const colorModeTextHover = useColorModeValue("purple", "yellow");
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
  const navRef = useRef<HTMLDivElement | null>();
  const navigate = useNavigate();
  const { account: userAccount, accountShort: userAccountShort } = useSelector(state => state.user, shallowEqual);
  const { account = "", accountShort, daiBalance, isConnected } = useSelector(state => state.web3, shallowEqual);
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
    <Wrap
      spacing={4}
      alignItems="center"
      backdropFilter="blur(10px)"
      backgroundColor={navBackgroundColor}
      overflow="visible"
      py={3}
      px={8}
      position="sticky"
      ref={el => (navRef.current = el)}
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
      {!userAccount ? (
        <>
          <WrapItem>
            <Button
              as={NavLink}
              to={"/login"}
              colorScheme={primaryButtonColor}
              leftIcon={<Icon icon={faSignInAlt} />}
              title="Click to log in."
            >
              Log In
            </Button>
          </WrapItem>
          <WrapItem>
            <IconButton
              aria-label="Switch between light and dark modes."
              _hover={{ color: colorModeTextHover }}
              icon={colorModeIcon}
              onClick={toggleColorMode}
            />
          </WrapItem>
        </>
      ) : (
        <>
          {isConnected ? (
            <>
              <WrapItem alignItems="center">
                <Tooltip label="Your active account's DAI balance.">
                  <Badge
                    colorScheme={getAddress(account) !== getAddress(userAccount) ? "yellow" : primaryButtonColor}
                    fontSize="md"
                  >
                    ◈ {daiDisplayBalance}
                  </Badge>
                </Tooltip>
              </WrapItem>
              <WrapItem>
                <Tooltip label={`Your active web3 account. Click to view account details on the explorer.`}>
                  <Button
                    as={Link}
                    colorScheme={getAddress(account) !== getAddress(userAccount) ? "yellow" : undefined}
                    href={`https://arbiscan.io/address/${account}`}
                    isExternal
                    leftIcon={<Icon icon={faEthereum} />}
                    variant="ghost"
                  >
                    {accountShort}
                  </Button>
                </Tooltip>
              </WrapItem>
            </>
          ) : (
            <WrapItem>
              <Button leftIcon={<Icon icon={faEthereum} />} onClick={handleConnect}>
                Connect
              </Button>
            </WrapItem>
          )}
          <WrapItem>
            <BasketButton />
          </WrapItem>
          <WrapItem>
            <Menu>
              <MenuButton
                as={Button}
                colorScheme={primaryButtonColor}
                leftIcon={<Icon icon={faUserCircle} title={`Login account: ${userAccount}`} />}
                rightIcon={<ChevronDownIcon />}
              >
                {userAccountShort || "Dashboard"}
              </MenuButton>
              <MenuList>
                <MenuItem
                  as={NavLink}
                  to={"/dashboard/payment"}
                  icon={<Icon icon={faEthereum} fixedWidth />}
                  sx={activeStyle}
                >
                  Payment
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  to={"/dashboard"}
                  end
                  icon={<Icon icon={faHeadphonesAlt} fixedWidth />}
                  sx={activeStyle}
                >
                  Releases
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  to={"/dashboard/artists"}
                  icon={<Icon icon={faArchive} fixedWidth />}
                  sx={activeStyle}
                >
                  Artists
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  to={"/dashboard/activity"}
                  icon={<Icon icon={faRectangleList} fixedWidth />}
                  sx={activeStyle}
                >
                  Activity Log
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  to={"/dashboard/collection"}
                  icon={<Icon icon={faArchive} fixedWidth />}
                  sx={activeStyle}
                >
                  Collection
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  to={"/dashboard/favourites"}
                  icon={<Icon icon={faHeart} fixedWidth />}
                  sx={activeStyle}
                >
                  Faves
                </MenuItem>
                <MenuItem
                  as={NavLink}
                  to={"/dashboard/wishlist"}
                  icon={<Icon icon={faMagic} fixedWidth />}
                  sx={activeStyle}
                >
                  List
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<Icon icon={faSignOutAlt} fixedWidth />} onClick={handleLogout}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          </WrapItem>
          <WrapItem>
            <IconButton
              aria-label="Switch between light and dark modes."
              _hover={{ color: colorModeTextHover }}
              icon={colorModeIcon}
              onClick={toggleColorMode}
            />
          </WrapItem>
        </>
      )}
    </Wrap>
  );
};

export default MenuBar;