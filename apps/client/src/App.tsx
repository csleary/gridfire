import { Box, Center, Flex, Link, Slide, Spacer, Spinner, useColorModeValue } from "@chakra-ui/react";
import { faNetworkWired } from "@fortawesome/free-solid-svg-icons";
import detectEthereumProvider from "@metamask/detect-provider";
import { BrowserProvider, Eip1193Provider, isError } from "ethers";
import React, { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Footer from "@/components/footer";
import Icon from "@/components/icon";
import Player from "@/components/player";
import PrivateRoute from "@/components/privateRoute";
import { useDispatch, useSelector } from "@/hooks";
import useSSE from "@/hooks/useSSE";
import { setLastCheckedOn } from "@/state/artists";
import { fetchUser } from "@/state/user";
import { setIsConnected, setNetworkName } from "@/state/web3";
const About = lazy(() => import("@/pages/about"));
const Artist = lazy(() => import("@/pages/artist"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const EditRelease = lazy(() => import("@/pages/editRelease"));
const Header = lazy(() => import("@/components/header"));
const Home = lazy(() => import("@/pages/home"));
const Login = lazy(() => import("@/pages/login"));
const ReleaseDetails = lazy(() => import("@/pages/releaseDetails"));
const SearchResults = lazy(() => import("@/pages/search"));

const VITE_CHAIN_ID = import.meta.env.VITE_CHAIN_ID;

const App: React.FC = () => {
  useSSE();
  const dispatch = useDispatch();
  const ethereumRef = useRef<any>(null);
  const providerRef = useRef<BrowserProvider>(null);
  const chainId = useSelector(state => state.web3.chainId);
  const isCorrectChain = Boolean(chainId) && chainId === VITE_CHAIN_ID;

  const getNetwork = useCallback(async () => {
    const browserProvider = new BrowserProvider(ethereumRef.current as unknown as Eip1193Provider);
    providerRef.current = browserProvider;

    providerRef.current.on("error", (error: unknown) => {
      if (error instanceof Error) {
        console.error(error);
      }
    });

    if (!providerRef.current) {
      console.warn("No web3 provider available!");
      return;
    }

    try {
      const network = await providerRef.current.getNetwork();
      const { chainId, name } = network;
      const id = chainId.toString();
      dispatch(setNetworkName({ chainId: id, name }));
      console.info(`Connected to ${name} network (${id}).`);

      if (Boolean(id) && id !== VITE_CHAIN_ID) {
        dispatch(setIsConnected(false));
      }
    } catch (error: unknown) {
      if (!isError(error, "NETWORK_ERROR")) {
        console.warn(error);
      }

      if (error instanceof Error) {
        console.error(error);
      }
    }
  }, [dispatch]);

  const handleChainChanged = useCallback(getNetwork, [getNetwork]);

  const getUser = useCallback(async () => {
    const user = await dispatch(fetchUser());
    const { _id: userId } = user || {};
    if (!userId) return;
    const lastCheckedOn = window.localStorage.getItem("lastCheckedOn");
    let storedUserDate = null;

    try {
      if (lastCheckedOn) {
        storedUserDate = JSON.parse(lastCheckedOn);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error);
      }
    }

    if (storedUserDate && storedUserDate.user === userId) {
      const { date } = storedUserDate;
      dispatch(setLastCheckedOn(date));
    }
  }, [dispatch]);

  const initialiseWeb3 = useCallback(async () => {
    const ethereum = await detectEthereumProvider();
    if (ethereum == null) return;
    ethereumRef.current = ethereum;
    ethereumRef.current.on("chainChanged", handleChainChanged);
    getNetwork();
  }, [getNetwork, handleChainChanged]);

  useEffect(() => {
    getUser();
    initialiseWeb3();
  }, [getUser, initialiseWeb3]);

  return (
    <BrowserRouter>
      <Slide direction="bottom" in={Boolean(chainId) && !isCorrectChain} style={{ zIndex: 10 }} unmountOnExit>
        <Center bg="yellow.400" color="gray.800" fontWeight="semibold" p={4} shadow="md">
          <Box>
            <Box>
              <Icon icon={faNetworkWired} mr={2} />
              Please switch to the Arbitrum network to use Gridfire
            </Box>
            <Link
              href="https://chainlist.org/chain/42161"
              isExternal
              rel="nofollow noopener"
              textAlign="center"
              textDecoration="underline"
            >
              Add the Arbitrum network to your wallet on ChainList
            </Link>
          </Box>
        </Center>
      </Slide>
      <Flex bg={useColorModeValue("gray.50", "gray.900")} flexDirection="column" maxW="100%" minH="100vh">
        <Suspense fallback={<></>}>
          <Header />
        </Suspense>
        <Flex direction="column" flex={1} px={[3, 4]} py={[2, 3, null, 4]}>
          <Suspense
            fallback={
              <Center flex={1}>
                <Spinner size="xl" />
              </Center>
            }
          >
            <Routes>
              <Route element={<Home />} path="/" />
              <Route element={<Login />} path="/login" />
              <Route element={<SearchResults />} path="/search" />
              <Route element={<About />} path="/about" />
              <Route
                element={
                  <PrivateRoute>
                    <EditRelease />
                  </PrivateRoute>
                }
                path="/release/new"
              />
              <Route
                element={
                  <PrivateRoute>
                    <EditRelease />
                  </PrivateRoute>
                }
                path="/release/:releaseId/edit"
              />
              <Route element={<ReleaseDetails />} path="/release/:releaseId/*" />
              <Route element={<Artist />} path="/artist/:artistId" />
              <Route
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
                path="/dashboard/*"
              />
              <Route element={<Artist />} path="/:artistSlug" />
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
