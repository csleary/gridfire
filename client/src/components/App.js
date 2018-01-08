import React, { Component } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { fetchUser } from '../actions';
import Login from './Login';
import Dashboard from './Dashboard';
import EditRelease from './EditRelease';
import Footer from './Footer';
import Header from './Header';
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
      logoOpacity: 0,
      isLoading: true
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchUser().then(() => this.setState({ isLoading: false }));

    let y = 0;
    let ticking = false;
    window.addEventListener('scroll', () => {
      y = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.showLogo(y);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  showLogo(y) {
    const headerHeight = document.getElementById('header').offsetHeight;
    if (y > headerHeight) {
      this.setState({ logoOpacity: 1 });
    } else {
      this.setState({ logoOpacity: 0 });
    }
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
        <div>
          <Header user={this.props.user} />
          <Navbar user={this.props.user} logoOpacity={this.state.logoOpacity} />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route
              exact
              strict
              path="/release/:id"
              component={SelectedRelease}
            />
            <PrivateRoute path="/release/add/" component={EditRelease} />
            <PrivateRoute path="/release/edit/:id" component={EditRelease} />
            <PrivateRoute path="/payment/:id" component={Payment} />
            <PrivateRoute path="/dashboard" component={Dashboard} />
          </Switch>
          <Footer />
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
