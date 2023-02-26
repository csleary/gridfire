import { Box, Center, Container, Flex, Slide, Spacer, Spinner, useColorModeValue } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import React, { Suspense, lazy, useCallback, useEffect, useRef } from "react";
import { fetchDaiAllowance, fetchDaiBalance, setAccount, setIsConnected, setNetworkName } from "state/web3";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { BrowserProvider } from "ethers";
import Icon from "components/icon";
import Footer from "components/footer";
import Player from "components/player";
import PrivateRoute from "components/privateRoute";
import { RootState } from "index";
import detectEthereumProvider from "@metamask/detect-provider";
import { faNetworkWired } from "@fortawesome/free-solid-svg-icons";
import { fetchUser } from "state/user";
import useSSE from "hooks/useSSE";

const { REACT_APP_CHAIN_ID = "" } = process.env;
const About = lazy(() => import("pages/about"));
const ArtistPage = lazy(() => import("pages/artistPage"));
const Dashboard = lazy(() => import("pages/dashboard"));
const EditRelease = lazy(() => import("pages/editRelease"));
const Header = lazy(() => import("components/header"));
const Home = lazy(() => import("pages/home"));
const Login = lazy(() => import("pages/login"));
const ReleaseDetails = lazy(() => import("pages/releaseDetails"));
const SearchResults = lazy(() => import("pages/searchResults"));
// declare const window: any; // eslint-disable-line

const App: React.FC = () => {
  useSSE();
  const dispatch = useDispatch();
  const ethereumRef: any = useRef();
  const { account } = useSelector((state: RootState) => state.user, shallowEqual);
  const { chainId, isConnected } = useSelector((state: RootState) => state.web3, shallowEqual);

  const getAccountInfo = useCallback(() => {
    if (account) {
      dispatch(fetchDaiAllowance(account));
      dispatch(fetchDaiBalance(account));
    }
  }, [account, dispatch]);

  const getNetwork = useCallback(() => {
    const provider = new BrowserProvider(ethereumRef.current);
    provider.getNetwork().then(network => dispatch(setNetworkName(network)));
  }, [dispatch]);

  const handleAccountsChanged = useCallback(
    (accounts: string[]): void => {
      const [account] = accounts;

      if (account) {
        dispatch(setAccount(account));
        dispatch(fetchDaiAllowance(account));
        dispatch(fetchDaiBalance(account));
        dispatch(setIsConnected(true));
      } else {
        dispatch(setIsConnected(false));
      }
    },
    [dispatch]
  );

  const handleChainChanged = useCallback(
    (chainId: bigint): void => {
      // window.location.reload();
      getAccountInfo();
      getNetwork();
    },
    [getAccountInfo, getNetwork]
  );

  useEffect(() => {
    dispatch(fetchUser());

    detectEthereumProvider().then((ethereum: any) => {
      if (ethereum == null) return;
      ethereumRef.current = ethereum;
      ethereumRef.current.on("accountsChanged", handleAccountsChanged);
      ethereumRef.current.on("chainChanged", handleChainChanged);
      getNetwork();
    });

    return () => {
      if (ethereumRef.current != null) {
        ethereumRef.current.removeListener("accountsChanged", handleAccountsChanged);
        ethereumRef.current.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [dispatch, getNetwork, handleAccountsChanged, handleChainChanged]);

  return (
    <BrowserRouter>
      <Slide
        direction="bottom"
        in={isConnected && chainId !== 0n && chainId !== BigInt(REACT_APP_CHAIN_ID)}
        style={{ zIndex: 10 }}
      >
        <Box bg="yellow.400" color="gray.800" fontWeight="semibold" p={4} shadow="md">
          <Container>
            <Icon icon={faNetworkWired} mr={2} />
            Please switch to the Arbitrum network to use GridFire.
          </Container>
        </Box>
      </Slide>
      <Flex maxW="100%" bg={useColorModeValue("gray.50", "gray.900")} minH="100vh" flexDirection="column">
        <Suspense fallback={<></>}>
          <Header />
        </Suspense>
        <Flex direction="column" flex={1} px={[1, 4, null, 8]} py={[1, 3, null, 6]}>
          <Suspense
            fallback={
              <Center flex={1}>
                <Spinner size="xl" />
              </Center>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/oauth/:service" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/about" element={<About />} />
              <Route
                path="/release/new"
                element={
                  <PrivateRoute>
                    <EditRelease />
                  </PrivateRoute>
                }
              />
              <Route
                path="/release/:releaseId/edit"
                element={
                  <PrivateRoute>
                    <EditRelease />
                  </PrivateRoute>
                }
              />
              <Route path="/release/:releaseId/*" element={<ReleaseDetails />} />
              <Route path="/artist/:artistId" element={<ArtistPage />} />
              <Route
                path="/dashboard/*"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route path="/:artistSlug" element={<ArtistPage />} />
            </Routes>
            <Spacer mb={8} />
          </Suspense>
          <Footer />
          <Player />
        </Flex>
      </Flex>
    </BrowserRouter>
  );
};

export default App;
