import React, { Component, Fragment } from 'react';
import FontAwesome from 'react-fontawesome';
import RenderTrack from './RenderTrack';

class RenderTrackList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dragOrigin: null,
      dragActive: false,
      isAddingTrack: false,
      deletingTracks: []
    };
  }

  handleDeleteTrack = (remove, index) => {
    const { trackTitle } = this.props.release.trackList[index];
    this.handleConfirm(trackTitle, hasConfirmed => {
      if (!hasConfirmed) return;

      this.setState({
        deletingTracks: [...this.state.deletingTracks, index]
      });
      this.props.deleteTrack(
        this.props.release._id,
        this.props.release.trackList[index]._id,
        () => {
          remove(index);

          this.props.toastSuccess(
            `${(trackTitle && `'${trackTitle}'`) || 'Track'} deleted.`
          );
          this.setState({
            deletingTracks: this.state.deletingTracks.filter(
              track => track !== index
            )
          });
        }
      );
    });
  };

  handleConfirm = (title, callback) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete ${(title && `'${title}'`) ||
        'this track'}?`
    );
    callback(confirmation);
  };

  handleAddTrack = push => {
    this.setState({ isAddingTrack: true });
    this.props.addTrack(this.props.release._id, () => {
      this.setState({ isAddingTrack: false }, () => push());
    });
  };

  handleDragStart = index => {
    this.setState({ dragOrigin: index });
  };

  handleDragEnter = index => {
    this.setState({ dragActive: index });
  };

  handleDragOver = () => {};

  handleDragLeave = () => {};

  handleDrop = (fieldsMove, indexTo) => {
    const releaseId = this.props.release._id;
    const indexFrom = this.state.dragOrigin;
    this.props.moveTrack(releaseId, indexFrom, indexTo, () => {
      fieldsMove(indexFrom, indexTo);
    });
  };

  handleDragEnd = () => {
    this.setState({ dragOrigin: null, dragActive: false });
  };

  uploadProgress(index) {
    const track = this.props.release.trackList[index];
    const trackId = track && track._id;
    const filtered = this.props.audioUploadProgress.filter(el => trackId in el);
    if (filtered.length) return filtered[0][trackId];
  }

  render() {
    const { isAddingTrack } = this.state;
    const { fields, release } = this.props;

    return (
      <Fragment>
        <ul className="list-group track-list">
          {fields.map((name, index) => {
            const track = release.trackList[index];
            if (!track) return null;
            const trackId = track._id;

            return (
              <RenderTrack
                audioUploadProgress={this.uploadProgress(index)}
                deletingTracks={this.state.deletingTracks}
                dragActive={this.state.dragActive}
                dragOrigin={this.state.dragOrigin}
                fields={fields}
                handleConfirm={this.handleConfirm}
                handleDeleteTrack={this.handleDeleteTrack}
                handleDragStart={this.handleDragStart}
                handleDragEnter={this.handleDragEnter}
                handleDragOver={this.handleDragOver}
                handleDragLeave={this.handleDragLeave}
                handleDrop={this.handleDrop}
                handleDragEnd={this.handleDragEnd}
                index={index}
                isTranscoding={this.props.isTranscoding.some(
                  id => id === trackId
                )}
                key={trackId}
                moveTrack={this.props.moveTrack}
                name={name}
                onDropAudio={this.props.onDropAudio}
                release={release}
                toastSuccess={this.props.toastSuccess}
              />
            );
          })}
        </ul>
        <button
          className="btn btn-outline-primary btn-sm add-track"
          disabled={isAddingTrack}
          onClick={() => this.handleAddTrack(fields.push)}
          title="Add Track"
          type="button"
        >
          {isAddingTrack ? (
            <FontAwesome name="circle-o-notch" spin className="mr-2" />
          ) : (
            <FontAwesome name="plus-circle" className="mr-2" />
          )}
          {isAddingTrack ? 'Adding…' : 'Add'}
        </button>
      </Fragment>
    );
  }
}

export default RenderTrackList;
