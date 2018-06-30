import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { Field } from 'redux-form';
import classNames from 'classnames';
import RenderTrackField from './RenderTrackField';
import ProgressBar from './ProgressBar';

class RenderTrack extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dragOrigin: null,
      dragActive: false
    };
  }

  handleMoveTrack = (swap, id, index, direction) => {
    this.props.moveTrack(id, index, index + direction, error => {
      if (error) return;
      swap(index, index + direction);
    });
  };

  handleConfirm = (title, callback) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete ${title || 'this track'}?`
    );
    if (confirmation) callback();
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
    this.props.moveTrack(releaseId, indexFrom, indexTo, error => {
      if (error) return;
      fieldsMove(indexFrom, indexTo);
    });
  };

  handleDragEnd = () => {
    this.setState({ dragOrigin: null, dragActive: false });
  };

  render() {
    const { fields, release, audioUploading } = this.props;
    const { trackList } = release;
    const id = release._id;

    return (
      <div>
        <ul className="list-group track-list">
          {fields.map((track, index) => {
            const trackId = trackList[index] && trackList[index]._id;
            const hasAudio =
              (release.trackList[index] && release.trackList[index].hasAudio) ||
              audioUploading[trackId] === 100;
            const isaudioUploading = audioUploading[trackId] < 100;
            const audioStatus = classNames({
              'audio-true': hasAudio,
              'audio-uploading': isaudioUploading,
              'audio-false': !hasAudio && !isaudioUploading
            });
            const classTrack = classNames('list-group-item', audioStatus, {
              'drag-active': this.state.dragActive === index,
              'drag-origin': this.state.dragOrigin === index
            });

            return (
              <li
                className={classTrack}
                draggable="true"
                key={`${track}._id`}
                onDragStart={() => this.handleDragStart(index)}
                onDragEnter={() => this.handleDragEnter(index)}
                onDragOver={() => this.handleDragOver()}
                onDragLeave={() => this.handleDragLeave()}
                onDrop={() => this.handleDrop(fields.move, index)}
                onDragEnd={() => this.handleDragEnd()}
                onTouchStart={() => {}}
              >
                <Field
                  component={RenderTrackField}
                  trackId={trackId}
                  hasAudio={hasAudio}
                  audioStatus={audioStatus}
                  index={index}
                  label={index + 1}
                  name={`${track}.trackTitle`}
                  release={this.props.release}
                  type="text"
                  onDropAudio={this.props.onDropAudio}
                  audioUploading={audioUploading[trackId]}
                />
                <div className="d-flex mt-3">
                  {index < fields.length - 1 && (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() =>
                        this.handleMoveTrack(fields.swap, id, index, 1)
                      }
                      title="Move Down"
                      type="button"
                    >
                      <FontAwesome name="arrow-down" className="icon-left" />
                      Down
                    </button>
                  )}
                  {index > 0 && (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() =>
                        this.handleMoveTrack(fields.swap, id, index, -1)
                      }
                      title="Move Up"
                      type="button"
                    >
                      <FontAwesome name="arrow-up" className="icon-left" />
                      Up
                    </button>
                  )}
                  <button
                    className="btn btn-outline-danger btn-sm ml-auto"
                    onClick={() =>
                      this.handleConfirm(
                        this.props.release.trackList[index].trackTitle,
                        () => {
                          this.props
                            .deleteTrack(
                              this.props.release._id,
                              this.props.release.trackList[index]._id
                            )
                            .then(fields.remove(index));
                        }
                      )
                    }
                    title="Delete Track"
                    type="button"
                  >
                    <FontAwesome name="trash" className="icon-left" />
                    Delete
                  </button>
                </div>
                <ProgressBar
                  percentComplete={audioUploading[trackId]}
                  willDisplay={
                    audioUploading[trackId] && audioUploading[trackId] < 100
                  }
                />
              </li>
            );
          })}
        </ul>
        <button
          className="btn btn-outline-primary btn-sm add-track"
          onClick={() => {
            this.props.addTrack(this.props.release._id).then(fields.push());
          }}
          title="Add Track"
          type="button"
        >
          <FontAwesome name="plus-circle" className="icon-left" />
          Add
        </button>
      </div>
    );
  }
}

export default RenderTrack;
