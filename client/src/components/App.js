import React, { Component } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Route } from 'react-router-dom';
import 'lazysizes';
import { fetchUser } from '../actions';
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
import SelectedRelease from './SelectedRelease';
import SearchResults from './SearchResults';
import Support from './Support';
import ToastList from './ToastList';

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
    const { user } = this.props;

    return (
      <BrowserRouter>
        <div className="app-wrapper">
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
  }
}

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default connect(
  mapStateToProps,
  { fetchUser }
)(App);
