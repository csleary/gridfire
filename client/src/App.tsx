import './app.css';
import 'lazysizes';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import About from 'pages/about';
import ActiveRelease from 'pages/activeRelease';
import ArtistPage from 'pages/artistPage';
import Contact from 'pages/contact';
import Dashboard from 'pages/dashboard';
import EditRelease from 'pages/editRelease';
import Footer from 'components/footer';
import ForgotPassword from 'pages/forgotPassword';
import Header from 'components/header';
import Home from 'pages/home';
import Login from 'pages/login';
import NavBar from 'pages/navBar';
import Player from 'pages/player';
import PrivateRoute from 'components/privateRoute';
import React from 'react';
import Register from 'pages/register';
import ResetPassword from 'pages/resetPassword';
import SearchResults from 'pages/searchResults';
import Support from 'pages/support';
import ToastList from 'components/toastList';
import { fetchUser } from 'features/user';
import styles from './App.module.css';
import { useDispatch } from 'react-redux';

const App: React.FC = () => {
  const dispatch = useDispatch();
  dispatch(fetchUser());

  return (
    <BrowserRouter>
      <div className={styles.wrapper}>
        <Header />
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/oauth/:service" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset" element={<ForgotPassword />} />
          <Route path="/reset/:token" element={<ResetPassword />} />
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
          <Route path="/release/:releaseId" element={<ActiveRelease />} />
          <Route path="/artist/:artistId" element={<ArtistPage />} />
          <Route
            path="/dashboard*"
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
