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
import Toast from './Toast';

class App extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchUser();
  }

  render() {
    const PrivateRoute = ({ component: PrivateComponent, ...rest }) => (
      <Route
        {...rest}
        render={props =>
          (this.props.user.isLoggedIn ? (
            <PrivateComponent {...props} />
          ) : (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location }
              }}
            />
          ))
        }
      />
    );

    return (
      <BrowserRouter>
        <div>
          <Header user={this.props.user} />
          <Navbar user={this.props.user} />
          <main className="App container-fluid">
            <div className="row justify-content-center">
              <div className="col-lg-8">
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
                  <PrivateRoute
                    path="/release/edit/:id"
                    component={EditRelease}
                  />
                  <PrivateRoute path="/payment/:id" component={Payment} />
                  <PrivateRoute path="/dashboard" component={Dashboard} />
                </Switch>
              </div>
            </div>
          </main>
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
