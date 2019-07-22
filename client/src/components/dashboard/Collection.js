import '../../style/home.css';
import React, { useEffect, useState } from 'react';
import {
  fetchCollection,
  fetchDownloadToken,
  fetchRelease,
  playTrack,
  toastInfo
} from '../../actions';
import RenderRelease from '../RenderRelease';
import Spinner from '../Spinner';
import { connect } from 'react-redux';

function Collection(props) {
  const [isLoading, setLoading] = useState(false);
  const { collection, fetchCollection } = props;

  useEffect(() => {
    if (!collection.length) {
      setLoading(true);
    }
    fetchCollection().then(() => setLoading(false));
  }, [fetchCollection, collection.length]);

  const renderReleases = collection.map(release => (
    <RenderRelease
      fetchDownloadToken={props.fetchDownloadToken}
      fetchRelease={props.fetchRelease}
      key={release._id}
      playTrack={props.playTrack}
      release={release}
      toastInfo={props.toastInfo}
      variation="collection"
    />
  ));

  if (isLoading) {
    return (
      <Spinner>
        <h2>Loading collection&hellip;</h2>
      </Spinner>
    );
  }

  if (!collection.length) {
    return (
      <main className="container">
        <div className="row">
          <div className="col">
            <h3 className="text-center mt-4">No releases found</h3>
            <p className="text-center">
              Once you&rsquo;ve purchased a release it will be added to your
              collection, where you&rsquo;ll have easy access to downloads.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-fluid">
      <div className="row">
        <div className="col py-3">
          <h3 className="text-center">
            Your Collection ({collection.length} release
            {collection.length > 1 ? 's' : ''})
          </h3>
          <div className="front-page">{renderReleases}</div>
        </div>
      </div>
    </main>
  );
}

function mapStateToProps(state) {
  return {
    collection: state.releases.collection
  };
}

export default connect(
  mapStateToProps,
  {
    fetchCollection,
    fetchDownloadToken,
    fetchRelease,
    playTrack,
    toastInfo
  }
)(Collection);
