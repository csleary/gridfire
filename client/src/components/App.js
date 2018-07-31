import React, { Component } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import 'lazysizes';
import { fetchUser, logOut, toastSuccess } from '../actions';
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
import Navbar from './Navbar';
import Payment from './Payment';
import Player from './Player';
import Register from './Register';
import ResetPassword from './ResetPassword';
import SelectedRelease from './SelectedRelease';
import Spinner from './Spinner';
import Support from './Support';
import Toast from './Toast';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchUser().then(() => this.setState({ isLoading: false }));
  }

  render() {
    const PrivateRoute = ({ component: PrivateComponent, ...rest }) => (
      <Route
        {...rest}
        render={props => {
          if (this.state.isLoading) {
            return <Spinner />;
          }
          if (typeof this.props.user.auth !== 'undefined') {
            return <PrivateComponent {...props} />;
          }
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location }
              }}
            />
          );
        }}
      />
    );

    return (
      <BrowserRouter>
        <div className="app-wrapper">
          <Header />
          <Navbar
            user={this.props.user}
            fetchUser={this.props.fetchUser}
            logOut={this.props.logOut}
            toastSuccess={this.props.toastSuccess}
          />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/register" component={Register} />
            <Route path="/about" component={About} />
            <Route path="/login" component={Login} />
            <Route exact strict path="/reset" component={ForgotPassword} />
            <Route
              exact
              strict
              path="/reset/:token"
              component={ResetPassword}
            />
            <Route path="/contact" component={Contact} />
            <Route path="/support" component={Support} />
            <Route path="/artist/:artist" component={ArtistPage} />
            <Route
              exact
              strict
              path="/release/:releaseId"
              component={SelectedRelease}
            />
            <PrivateRoute path="/release/add/" component={EditRelease} />
            <PrivateRoute
              path="/release/edit/:releaseId"
              component={EditRelease}
            />
            <PrivateRoute path="/payment/:releaseId" component={Payment} />
            <PrivateRoute path="/dashboard" component={Dashboard} />
          </Switch>
          <Footer user={this.props.user} />
          <Player />
          <Toast />
        </div>
      </BrowserRouter>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default connect(
  mapStateToProps,
  { fetchUser, logOut, toastSuccess }
)(App);
