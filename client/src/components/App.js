import React, { Component } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import 'lazysizes';
import { fetchUser } from '../actions';
import Login from './Login';
import Dashboard from './Dashboard';
import EditRelease from './EditRelease';
import Footer from './Footer';
import Header from './Header';
import Support from './Support';
import Home from './Home';
import Navbar from './Navbar';
import Payment from './Payment';
import Player from './Player';
import Register from './Register';
import SelectedRelease from './SelectedRelease';
import Spinner from './Spinner';
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
          if (this.props.user.isLoggedIn) {
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
          <Navbar user={this.props.user} />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/support" component={Support} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
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

export default connect(mapStateToProps, { fetchUser })(App);
