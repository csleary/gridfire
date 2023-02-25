import { Route, Routes } from "react-router-dom";
import Payment from "./payment";
import Artists from "./artists";
import Collection from "./collection";
import Favourites from "./favourites";
import { Helmet } from "react-helmet";
import UserReleases from "./userReleases";
import WishList from "./wishList";

const Dashboard = () => (
  <>
    <Helmet>
      <title>Dashboard | GridFire</title>
      <meta
        name="description"
        content="Take control of your GridFire account. Add music, configure your payment details, add artist information and more."
      />
    </Helmet>
    <Routes>
      <Route path="/artists" element={<Artists />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/favourites" element={<Favourites />} />
      <Route path="/payment/*" element={<Payment />} />
      <Route path="/wishlist" element={<WishList />} />
      <Route path="/" element={<UserReleases />} />
    </Routes>
  </>
);

export default Dashboard;
