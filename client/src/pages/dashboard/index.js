import { Route, Routes } from 'react-router-dom';
import Artists from './artists';
import Collection from './collection';
import Favourites from './favourites';
import { Helmet } from 'react-helmet';
import NemAddress from './nemAddress';
import PasswordUpdate from './passwordUpdate';
import React from 'react';
import UserReleases from './userReleases';
import WishList from './wishList';

const Dashboard = () => (
  <>
    <Helmet>
      <title>Dashboard | nemp3</title>
      <meta
        name="description"
        content="Take control of your nemp3 account. Add music, configure your payment details, add artist information and more."
      />
    </Helmet>
    <Routes>
      <Route path="/artists" element={<Artists />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/favourites" element={<Favourites />} />
      <Route path="/nem-address" element={<NemAddress />} />
      <Route path="/password-update" element={<PasswordUpdate />} />
      <Route path="/wishlist" element={<WishList />} />
      <Route path="/" element={<UserReleases />} />
    </Routes>
  </>
);

export default Dashboard;
