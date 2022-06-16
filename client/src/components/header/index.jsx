import {
  Badge,
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
  faFireAlt,
  faHeadphonesAlt,
  faHeart,
  faMagic,
  faNetworkWired,
  faSignInAlt,
  faSignOutAlt,
  faUserCircle
} from "@fortawesome/free-solid-svg-icons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import BasketButton from "./basketButton";
import Icon from "components/icon";
import SearchBar from "../searchBar";
import { connectToWeb3 } from "state/web3";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { logOut } from "state/user";
import { useNavigate } from "react-router-dom";
import { utils } from "ethers";

const Header = () => {
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
  const { account = "", accountShort, daiBalance, chainId, isConnected, networkName } = web3 || {};
  const formattedNetworkName = networkName.replace("-", " ").toUpperCase();
  const infoTextColor = useColorModeValue("gray.500", "gray.400");
  const daiDisplayBalance = Number.parseFloat(utils.formatEther(daiBalance)).toFixed(2);

  const handleLogout = () => {
    dispatch(logOut()).then(() => navigate("/"));
  };

  const handleConnect = async () => {
    await dispatch(connectToWeb3());
  };

  return (
    <Wrap spacing={4} alignItems="center" mb={4}>
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
      <WrapItem alignItems="center">
        <Badge colorScheme={primaryButtonColor} fontSize="xs" title={`Chain ID: ${chainId}`}>
          <Icon icon={faNetworkWired} mr={1} />
          {formattedNetworkName}
        </Badge>
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
            <IconButton _hover={{ color: colorModeTextHover }} icon={colorModeIcon} onClick={toggleColorMode} />
          </WrapItem>
        </>
      ) : (
        <>
          {isConnected ? (
            <>
              <WrapItem alignItems="center">
                <Badge
                  colorScheme={primaryButtonColor}
                  fontSize="md"
                  title={`Current DAI balance: ${daiDisplayBalance}`}
                >
                  ◈ {daiDisplayBalance}
                </Badge>
              </WrapItem>
              <WrapItem>
                <Button
                  as={Link}
                  href={`https://etherscan.io/address/${account}`}
                  isExternal
                  leftIcon={<Icon icon={faEthereum} />}
                  title={`Active address: ${account}`}
                  variant="ghost"
                >
                  {accountShort}
                </Button>
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
                leftIcon={<Icon icon={faUserCircle} />}
                rightIcon={<ChevronDownIcon />}
                title="Visit your dashboard."
              >
                Dashboard
              </MenuButton>
              <MenuList>
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
                  to={"/dashboard"}
                  end
                  icon={<Icon icon={faHeadphonesAlt} fixedWidth />}
                  sx={activeStyle}
                >
                  Releases
                </MenuItem>
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
            <IconButton _hover={{ color: colorModeTextHover }} icon={colorModeIcon} onClick={toggleColorMode} />
          </WrapItem>
        </>
      )}
    </Wrap>
  );
};

export default Header;
