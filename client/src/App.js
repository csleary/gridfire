import './app.css';
import 'lazysizes';
import { BrowserRouter, Route } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
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
import Payment from 'components/payment';
import Player from 'components/player';
import PrivateRoute from 'components/privateRoute';
import PropTypes from 'prop-types';
import Register from 'components/register';
import ResetPassword from 'components/resetPassword';
import SearchResults from 'components/searchResults';
import SelectedRelease from 'components/selectedRelease';
import Support from 'components/support';
import ToastList from 'components/toastList';
import { connect } from 'react-redux';
import { fetchUser } from 'actions';
import { wrapper } from './App.module.css';

const App = ({ fetchUser: loadUser, user }) => {
  const [, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadUser().then(() => setLoading(false));
  }, [loadUser]);

  return (
    <BrowserRouter>
      <div className={wrapper}>
        <Header />
        <NavBar />
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
        <PrivateRoute
          strict
          exact
          path="/release/add/"
          component={EditRelease}
        />
        <PrivateRoute
          strict
          exact
          path="/release/edit/:releaseId"
          component={EditRelease}
        />
        <Route
          strict
          exact
          path="/release/:releaseId"
          component={SelectedRelease}
        />
        <Route path="/artist/:artist" component={ArtistPage} />
        <PrivateRoute path="/payment/:releaseId" component={Payment} />
        <PrivateRoute path="/dashboard" component={Dashboard} />
        <Footer user={user} />
        <Player />
        <ToastList />
      </div>
    </BrowserRouter>
  );
};

App.propTypes = {
  fetchUser: PropTypes.func,
  user: PropTypes.object
};

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default connect(
  mapStateToProps,
  { fetchUser }
)(App);
