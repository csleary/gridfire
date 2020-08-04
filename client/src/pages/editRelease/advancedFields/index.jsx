import { Field } from 'redux-form';
import React from 'react';
import RenderReleaseField from '../renderReleaseField';

const AdvancedFields = () => (
  <>
    <Field component={RenderReleaseField} label="Record Label" name="recordLabel" type="text" />
    <Field
      component={RenderReleaseField}
      formText="Your own identifier, if you have one."
      label="Catalogue Number"
      name="catNumber"
      type="text"
    />
    <Field
      component={RenderReleaseField}
      formText="Notable release information, e.g. press release copy, review quotes, equipment, concepts."
      label="Release Info"
      name="info"
      type="textarea"
    />
    <Field
      component={RenderReleaseField}
      formText="To credit writers, performers, producers, designers and engineers involved."
      label="Credits"
      name="credits"
      type="textarea"
    />
    <div className="row p-0">
      <div className="col">
        <Field component={RenderReleaseField} label="Copyright Year" name="cLine.year" type="number" />
      </div>
      <div className="col">
        <Field
          component={RenderReleaseField}
          formText="i.e. Label, publisher or artist/individual."
          label="Copyright Owner"
          name="cLine.owner"
          type="text"
        />
      </div>
    </div>
    <div className="row p-0">
      <div className="col">
        <Field
          component={RenderReleaseField}
          formText="Year first released as a recording."
          label="Recording Copyright Year"
          name="pLine.year"
          type="number"
        />
      </div>
      <div className="col">
        <Field
          component={RenderReleaseField}
          formText="i.e. Label or artist/individual."
          label="Recording Copyright Owner"
          name="pLine.owner"
          type="text"
        />
      </div>
    </div>
  </>
);

export default AdvancedFields;
