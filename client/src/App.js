import './app.css';
import 'lazysizes';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
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
import { useDispatch } from 'react-redux';
import { wrapper } from './App.module.css';

const App = () => {
  const dispatch = useDispatch();
  dispatch(fetchUser());

  return (
    <BrowserRouter>
      <div className={wrapper}>
        <Header />
        <NavBar />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/oauth/:service" component={Home} />
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
          <Route exact path="/reset" component={ForgotPassword} />
          <Route exact path="/reset/:token" component={ResetPassword} />
          <Route path="/search" component={SearchResults} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/support" component={Support} />
          <PrivateRoute exact path="/release/add/" component={EditRelease} />
          <PrivateRoute exact path="/release/:releaseId/edit" component={EditRelease} />
          <Route path="/release/:releaseId" component={ActiveRelease} />
          <Route path="/artist/:artistId" component={ArtistPage} />
          <PrivateRoute path="/dashboard" component={Dashboard} />
        </Switch>
        <Footer />
        <Player />
        <ToastList />
      </div>
    </BrowserRouter>
  );
};

export default App;
