import './app.css';
import 'lazysizes';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import About from 'components/about';
import ArtistPage from 'components/artistPage';
import Contact from 'components/contact';
import Dashboard from 'components/dashboard';
import EditRelease from 'components/editRelease';
import Footer from 'components/footer';
import ForgotPassword from 'components/forgotPassword';
import Header from 'components/header';
import Home from 'components/home';
import Login from 'components/login';
import NavBar from 'components/navBar';
import Player from 'components/player';
import PrivateRoute from 'components/privateRoute';
import React from 'react';
import Register from 'components/register';
import ResetPassword from 'components/resetPassword';
import SearchResults from 'components/searchResults';
import SelectedRelease from 'components/selectedRelease';
import Support from 'components/support';
import ToastList from 'components/toastList';
import { fetchUser } from 'actions/userActions';
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
          <PrivateRoute
            exact
            path="/release/:releaseId/edit"
            component={EditRelease}
          />
          <Route path="/release/:releaseId" component={SelectedRelease} />
          <Route path="/artist/:artist" component={ArtistPage} />
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
