import './app.css';
import 'lazysizes';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React, { useContext, useEffect } from 'react';
import { setAccount, setIsConnected, setNetworkName } from 'features/web3';
import About from 'pages/about';
import ActiveRelease from 'pages/activeRelease';
import ArtistPage from 'pages/artistPage';
import Contact from 'pages/contact';
import Dashboard from 'pages/dashboard';
import EditRelease from 'pages/editRelease';
import Footer from 'components/footer';
import Header from 'components/header';
import Home from 'pages/home';
import Login from 'pages/login';
import NavBar from 'pages/navBar';
import Player from 'pages/player';
import PrivateRoute from 'components/privateRoute';
import SearchResults from 'pages/searchResults';
import Support from 'pages/support';
import ToastList from 'components/toastList';
import { Web3Context } from 'index';
import { fetchUser } from 'features/user';
import styles from './App.module.css';
import { useDispatch } from 'react-redux';

declare const window: any; // eslint-disable-line

const App: React.FC = () => {
  const dispatch = useDispatch();
  const provider = useContext(Web3Context);

  useEffect(() => {
    dispatch(fetchUser());
    const signer = provider.getSigner();

    if (signer.provider) {
      signer
        .getAddress()
        .then(address => {
          dispatch(setAccount(address));
        })
        .catch(() => {
          dispatch(setIsConnected(false));
        });
    }

    const handleNetworkChanged = (network: Record<string, unknown>): void => {
      const { chainId, name } = network;
      dispatch(setNetworkName({ chainId, networkName: name }));
    };

    provider.on('network', handleNetworkChanged);
    const handleAccountsChanged = (accounts: string[]): void => void dispatch(setAccount(accounts[0]));
    const handleReload = (): void => void window.location.reload();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleReload);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleReload);
      }
    };
  }, []);

  return (
    <BrowserRouter>
      <div className={styles.wrapper}>
        <Header />
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/oauth/:service" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Support />} />
          <Route
            path="/release/add/"
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
        <Footer />
        <Player />
        <ToastList />
      </div>
    </BrowserRouter>
  );
};

export default App;
