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
  WrapItem
} from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  faArchive,
  faHeadphonesAlt,
  faHeart,
  faMagic,
  faPlus,
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

const activeStyle = { "&.active": { backgroundColor: "orange.100", color: "orange.700" } };

const NavBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, web3 } = useSelector(state => state, shallowEqual);
  const { auth } = user;
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
      {auth === undefined ? (
        <WrapItem>
          <Button
            as={NavLink}
            to={"/login"}
            colorScheme="yellow"
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
          <WrapItem>
            <Button leftIcon={<Icon icon={faPlus} />} as={NavLink} to={"/release/new"} title="Add a new release.">
              Add Release
            </Button>
          </WrapItem>
          <WrapItem>
            <Menu>
              <MenuButton
                as={Button}
                colorScheme="yellow"
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
