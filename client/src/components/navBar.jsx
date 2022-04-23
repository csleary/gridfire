import {
  Button,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Spacer,
  Wrap,
  WrapItem,
  useColorMode,
  IconButton,
  useColorModeValue
} from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { ChevronDownIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
  faArchive,
  faHeadphonesAlt,
  faHeart,
  faMagic,
  faSignInAlt,
  faSignOutAlt,
  faUserCircle
} from "@fortawesome/free-solid-svg-icons";
import { setAccount, setIsConnected } from "features/web3";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import Icon from "components/icon";
import SearchBar from "./searchBar";
import detectEthereumProvider from "@metamask/detect-provider";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { logOut } from "features/user";
import { toastError, toastWarning } from "features/toast";
import { useNavigate } from "react-router-dom";

const NavBar = () => {
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

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, web3 } = useSelector(state => state, shallowEqual);
  const { account: userAccount } = user;
  const { account = "", accountShort, isConnected } = web3 || {};

  const handleLogout = () => {
    dispatch(logOut()).then(() => navigate("/"));
  };

  const handleConnect = async () => {
    const ethereum = await detectEthereumProvider();

    if (!ethereum) {
      return void dispatch(
        toastWarning({ message: "No local wallet found. Do you have a web3 wallet installed?", title: "Warning" })
      );
    }

    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const [firstAccount] = accounts;
      if (!firstAccount)
        return void dispatch(toastWarning({ message: "Could not connect. Is the wallet unlocked?", title: "Warning" }));
      dispatch(setAccount(firstAccount));
      dispatch(setIsConnected(true));
    } catch (error) {
      dispatch(toastError({ message: error.message }));
    }
  };

  return (
    <Wrap spacing={4} alignItems="center" mb={4}>
      <WrapItem>
        <SearchBar />
      </WrapItem>
      <WrapItem alignItems="center">
        <Link as={NavLink} to={"/"}>
          GridFire
        </Link>
      </WrapItem>
      <Spacer />
      {!userAccount ? (
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
      ) : (
        <>
          {isConnected ? (
            <WrapItem>
              <Button
                as={Link}
                href={`https://etherscan.io/address/${account}`}
                isExternal
                leftIcon={<Icon icon={faEthereum} />}
                title={account}
                variant="ghost"
              >
                {accountShort}
              </Button>
            </WrapItem>
          ) : (
            <WrapItem>
              <Button leftIcon={<Icon icon={faEthereum} />} onClick={handleConnect}>
                Connect
              </Button>
            </WrapItem>
          )}
          <IconButton _hover={{ color: colorModeTextHover }} icon={colorModeIcon} onClick={toggleColorMode} />
          <WrapItem>
            <Menu>
              <MenuButton
                as={Button}
                colorScheme={primaryButtonColor}
                leftIcon={<Icon icon={faUserCircle} />}
                rightIcon={<ChevronDownIcon />}
                title="Visit your dashboard."
              >
                Dashboard
              </MenuButton>
              <MenuList>
                <MenuItem as={NavLink} to={"/dashboard/artists"} icon={<Icon icon={faArchive} />} sx={activeStyle}>
                  Artists
                </MenuItem>
                <MenuItem as={NavLink} to={"/dashboard"} end icon={<Icon icon={faHeadphonesAlt} />} sx={activeStyle}>
                  Releases
                </MenuItem>
                <MenuItem as={NavLink} to={"/dashboard/address"} icon={<Icon icon={faEthereum} />} sx={activeStyle}>
                  Payment
                </MenuItem>
                <MenuItem as={NavLink} to={"/dashboard/collection"} icon={<Icon icon={faArchive} />} sx={activeStyle}>
                  Collection
                </MenuItem>
                <MenuItem as={NavLink} to={"/dashboard/favourites"} icon={<Icon icon={faHeart} />} sx={activeStyle}>
                  Faves
                </MenuItem>
                <MenuItem as={NavLink} to={"/dashboard/wishlist"} icon={<Icon icon={faMagic} />} sx={activeStyle}>
                  List
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<Icon icon={faSignOutAlt} />} onClick={handleLogout}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          </WrapItem>
        </>
      )}
    </Wrap>
  );
};

export default NavBar;
