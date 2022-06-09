import { Center, Container, Flex, Spacer, Spinner, useColorModeValue } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import React, { Suspense, lazy, useEffect, useRef } from "react";
import { fetchDaiAllowance, fetchDaiBalance, setAccount, setIsConnected, setNetworkName } from "state/web3";
import Footer from "components/footer";
import Player from "pages/player";
import PrivateRoute from "components/privateRoute";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { fetchUser } from "state/user";
import { useDispatch } from "react-redux";
import useSSE from "hooks/useSSE";

const About = lazy(() => import("pages/about"));
const ActiveRelease = lazy(() => import("pages/activeRelease"));
const ArtistPage = lazy(() => import("pages/artistPage"));
const Dashboard = lazy(() => import("pages/dashboard"));
const EditRelease = lazy(() => import("pages/editRelease"));
const Header = lazy(() => import("components/header"));
const Home = lazy(() => import("pages/home"));
const Login = lazy(() => import("pages/login"));
const SearchResults = lazy(() => import("pages/searchResults"));
declare const window: any; // eslint-disable-line

const App: React.FC = () => {
  useSSE();
  const dispatch = useDispatch();
  const ethereumRef: any = useRef();

  useEffect(() => {
    dispatch(fetchUser());

    const handleAccountsChanged = (accounts: string[]): void => {
      const [account] = accounts;

      if (account) {
        dispatch(setAccount(account));
        dispatch(fetchDaiAllowance(account));
        dispatch(fetchDaiBalance(account));
        dispatch(setIsConnected(true));
      } else {
        dispatch(setIsConnected(false));
      }
    };

    const handleReload = (chainId: string): void => {
      window.location.reload();
    };

    detectEthereumProvider().then((ethereum: any) => {
      ethereumRef.current = ethereum;
      ethereumRef.current.on("accountsChanged", handleAccountsChanged);
      ethereumRef.current.on("chainChanged", handleReload);
      const provider = new ethers.providers.Web3Provider(ethereumRef.current);
      provider.getNetwork().then(network => dispatch(setNetworkName(network)));
    });

    return () => {
      if (ethereumRef.current !== "undefined") {
        ethereumRef.current.removeListener("accountsChanged", handleAccountsChanged);
        ethereumRef.current.removeListener("chainChanged", handleReload);
      }
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Container maxW="100%" bg={useColorModeValue("gray.50", "gray.900")} minH="100vh" px={8} py={6} display="flex">
        <Flex direction="column" flex={1}>
          <Suspense fallback={<></>}>
            <Header />
          </Suspense>
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
              <Route path="/release/:releaseId/*" element={<ActiveRelease />} />
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
      </Container>
    </BrowserRouter>
  );
};

export default App;
