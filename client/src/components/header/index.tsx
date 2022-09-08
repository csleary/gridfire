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
  Tooltip,
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
import { useDispatch, useSelector } from "hooks";
import BasketButton from "./basketButton";
import Icon from "components/icon";
import SearchBar from "../searchBar";
import { connectToWeb3 } from "state/web3";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { logOut } from "state/user";
import { shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import { utils } from "ethers";

const { REACT_APP_CHAIN_ID } = process.env;

const Header = () => {
  const { toggleColorMode } = useColorMode();
  const colorModeIcon = useColorModeValue(<MoonIcon />, <SunIcon />);
  const colorModeTextHover = useColorModeValue("purple", "yellow");
  const primaryButtonColor = useColorModeValue("yellow", "purple");
  const tooltipBgColor = useColorModeValue("gray.200", "gray.800");
  const tooltipColor = useColorModeValue("gray.800", "gray.100");

  const activeStyle = {
    "&.active": useColorModeValue(
      { backgroundColor: "orange.200", color: "orange.900" },
      { backgroundColor: "purple.200", color: "purple.900" }
    )
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, web3 } = useSelector(state => state, shallowEqual);
  const { account: userAccount, accountShort: userAccountShort } = user;
  const { account = "", accountShort, daiBalance, chainId, isConnected, networkName } = web3 || {};
  const formattedNetworkName = networkName.replace("-", " ").toUpperCase();
  const daiDisplayBalance = Number.parseFloat(utils.formatEther(daiBalance)).toFixed(2);

  const handleLogout = () => {
    dispatch(logOut()).then(() => navigate("/"));
  };

  const handleConnect = async () => {
    await dispatch(connectToWeb3());
  };

  return (
    <Wrap spacing={4} alignItems="center" mb={4} overflow="visible">
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
        <Badge
          colorScheme={chainId !== Number(REACT_APP_CHAIN_ID) ? "red" : primaryButtonColor}
          fontSize="xs"
          title={`Chain ID: ${chainId}`}
        >
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
                <Tooltip
                  hasArrow
                  openDelay={500}
                  label="Your active account's DAI balance."
                  bg={tooltipBgColor}
                  color={tooltipColor}
                >
                  <Badge colorScheme={account !== userAccount ? "yellow" : primaryButtonColor} fontSize="md">
                    ◈ {daiDisplayBalance}
                  </Badge>
                </Tooltip>
              </WrapItem>
              <WrapItem>
                <Tooltip
                  hasArrow
                  openDelay={500}
                  label={`Your active web3 account. Click to view account details on the explorer.`}
                  bg={tooltipBgColor}
                  color={tooltipColor}
                >
                  <Button
                    as={Link}
                    colorScheme={account !== userAccount ? "yellow" : undefined}
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

export default Header;
