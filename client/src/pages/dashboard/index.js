import Artists from './artists';
import Collection from './collection';
import Favourites from './favourites';
import { Helmet } from 'react-helmet';
import NemAddress from './nemAddress';
import PasswordUpdate from './passwordUpdate';
import PropTypes from 'prop-types';
import React from 'react';
import { Route } from 'react-router-dom';
import UserReleases from './userReleases';
import WishList from './wishList';

function Dashboard({ match }) {
  return (
    <>
      <Helmet>
        <title>Dashboard | nemp3</title>
        <meta
          name="description"
          content="Take control of your nemp3 account. Add music, configure your payment details, add artist information and more."
        />
      </Helmet>
      <Route exact path={`${match.path}/artists`} component={Artists} />
      <Route exact path={`${match.path}/collection`} component={Collection} />
      <Route exact path={`${match.path}/favourites`} component={Favourites} />
      <Route exact path={`${match.path}/nem-address`} component={NemAddress} />
      <Route exact path={`${match.path}/password-update`} component={PasswordUpdate} />
      <Route exact path={`${match.path}/wishlist`} component={WishList} />
      <Route exact path={match.path} component={UserReleases} />
    </>
  );
}

Dashboard.propTypes = {
  match: PropTypes.object
};

export default Dashboard;
