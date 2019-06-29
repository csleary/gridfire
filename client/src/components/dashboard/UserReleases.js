import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import Spinner from './../Spinner';
import UserRelease from './UserRelease';
import {
  deleteRelease,
  fetchSales,
  fetchUserReleases,
  publishStatus,
  toastSuccess,
  toastWarning
} from '../../actions';

class UserReleases extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDeletingRelease: false,
      salesData: null
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.props
      .fetchUserReleases()
      .then(() => this.props.fetchSales())
      .then(salesData => {
        this.props.userReleases.forEach(release => {
          const sales = salesData.filter(
            data => data.releaseId === release._id
          )[0];

          if (!sales) {
            this.setState({
              salesData: {
                ...this.state.salesData,
                [release._id]: 0
              }
            });
            return;
          }
          const total = sales.purchases.map(sale => sale.numSold);
          const sum = total.reduce((acc, el) => acc + el);

          this.setState({
            salesData: {
              ...this.state.salesData,
              [release._id]: sum
            }
          });
        });
      });
  }

  releasesOffline = () => {
    const { userReleases } = this.props;
    if (!userReleases) return;

    const offline = userReleases.filter(release => release.published === false);
    return offline.length;
  };

  renderUserReleases = () => {
    const { history, userReleases } = this.props;

    return userReleases.map(release => (
      <UserRelease
        deleteRelease={this.props.deleteRelease}
        history={history}
        key={release._id}
        publishStatus={this.props.publishStatus}
        numSold={this.state.salesData && this.state.salesData[release._id]}
        release={release}
        toastSuccess={this.props.toastSuccess}
        toastWarning={this.props.toastWarning}
        userReleases={this.props.userReleases}
      />
    ));
  };

  render() {
    const { isLoadingUserReleases, userReleases } = this.props;
    const releasesOffline = this.releasesOffline();

    if (isLoadingUserReleases) {
      return (
        <Spinner>
          <h2>Loading releases&hellip;</h2>
        </Spinner>
      );
    }

    if (!userReleases.length) {
      return (
        <main className="container">
          <div className="row">
            <div className="col p-3">
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
                  <FontAwesome name="plus-circle" className="mr-2" />
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
          <div className="col py-3">
            <h3 className="text-center">
              You have {userReleases.length} release
              {userReleases.length > 1 ? 's' : ''}{' '}
              {releasesOffline ? ` (${releasesOffline} offline)` : null}
            </h3>
            <ul className="user-releases">{this.renderUserReleases()}</ul>
            <Link
              className="btn btn-outline-primary btn-sm add-release"
              title="Add Release"
              role="button"
              to={'/release/add/'}
            >
              <FontAwesome name="plus-circle" className="mr-2" />
              Add Release
            </Link>
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    isLoadingUserReleases: state.releases.isLoading,
    salesData: state.salesData.releaseSales,
    userReleases: state.releases.userReleases
  };
}

export default connect(
  mapStateToProps,
  {
    deleteRelease,
    fetchSales,
    fetchUserReleases,
    publishStatus,
    toastSuccess,
    toastWarning
  }
)(UserReleases);
