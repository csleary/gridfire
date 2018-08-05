import React, { Component } from 'react';
import { connect } from 'react-redux';
import RenderRelease from './RenderRelease';
import Spinner from './Spinner';
import { fetchCatalogue, fetchRelease, playTrack, toastInfo } from '../actions';
import '../style/home.css';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    };
  }

  componentDidMount() {
    this.props.fetchCatalogue().then(() => {
      let { service } = this.props.match.params;
      if (service) {
        service = service.charAt(0).toUpperCase() + service.substring(1);
        this.props.toastInfo(
          `Thank you. You are now logged in using your ${service} account.`
        );
      }
      this.setState({ isLoading: false });
    });
  }

  render() {
    const { catalogue } = this.props;

    const renderReleases = catalogue.map(release => (
      <RenderRelease
        fetchRelease={this.props.fetchRelease}
        key={release._id}
        playTrack={this.props.playTrack}
        release={release}
        toastInfo={this.props.toastInfo}
      />
    ));

    if (this.state.isLoading) {
      return (
        <Spinner>
          <h2 className="mt-4">Loading catalogue&hellip;</h2>
        </Spinner>
      );
    }
    return (
      <main className="container-fluid">
        <div className="row">
          <div className="col">
            <div className="front-page">{renderReleases}</div>
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    catalogue: state.releases.catalogue
  };
}

export default connect(
  mapStateToProps,
  {
    fetchCatalogue,
    fetchRelease,
    playTrack,
    toastInfo
  }
)(Home);
