import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import Spinner from './../Spinner';
import UserRelease from './UserRelease';

class UserReleases extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDeletingRelease: false
    };
  }

  renderUserReleases = () => {
    const {
      deleteRelease,
      history,
      publishStatus,
      salesData,
      toastMessage,
      userReleases
    } = this.props;

    return userReleases.map(release => (
      <UserRelease
        deleteRelease={deleteRelease}
        history={history}
        key={release._id}
        publishStatus={publishStatus}
        salesData={salesData}
        release={release}
        toastMessage={toastMessage}
        userReleases={userReleases}
      />
    ));
  };

  render() {
    const { isLoadingUserReleases, userReleases } = this.props;

    if (isLoadingUserReleases) {
      return <Spinner />;
    }

    if (!userReleases.length) {
      return (
        <main className="container">
          <div className="row">
            <div className="col">
              <h3 className="text-center mt-4">Add your first release</h3>
              <p className="text-center">
                You don&rsquo;t currently have any releases for sale. Please hit
                the button below to add your first release.
              </p>
              <div className="d-flex justify-content-center">
                <Link
                  className="btn btn-outline-primary btn-sm add-release mt-5 mb-4"
                  title="Add Release"
                  role="button"
                  to={'/release/add/'}
                >
                  <FontAwesome name="plus-circle" className="icon-left" />
                  Add Release
                </Link>
              </div>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="container-fluid">
        <div className="row">
          <div className="col-lg">
            <h3 className="text-center">
              You have {userReleases.length} release{userReleases.length > 1
                ? 's'
                : ''}
            </h3>
            <ul className="user-releases">{this.renderUserReleases()}</ul>
            <Link
              className="btn btn-outline-primary btn-sm add-release"
              title="Add Release"
              role="button"
              to={'/release/add/'}
            >
              <FontAwesome name="plus-circle" className="icon-left" />
              Add Release
            </Link>
          </div>
        </div>
      </main>
    );
  }
}

export default UserReleases;
