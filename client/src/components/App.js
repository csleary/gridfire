import '../style/app.css';
import 'lazysizes';
import { BrowserRouter, Route } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import About from './About';
import ArtistPage from './ArtistPage';
import Contact from './Contact';
import Dashboard from './Dashboard';
import EditRelease from './EditRelease';
import Footer from './Footer';
import ForgotPassword from './ForgotPassword';
import Header from './Header';
import Home from './Home';
import Login from './Login';
import NavBar from './NavBar';
import Payment from './Payment';
import Player from './Player';
import PrivateRoute from './PrivateRoute';
import Register from './Register';
import ResetPassword from './ResetPassword';
import SearchResults from './SearchResults';
import SelectedRelease from './SelectedRelease';
import Support from './Support';
import ToastList from './ToastList';
import { connect } from 'react-redux';
import { fetchUser } from '../actions';
import { wrapper } from '../style/App.module.css';

const App = ({ fetchUser, user }) => {
  const [, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUser().then(() => setLoading(false));
  }, [fetchUser]);

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

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default connect(
  mapStateToProps,
  { fetchUser }
)(App);
