import Input from 'components/input';
import PropTypes from 'prop-types';
import React from 'react';

const AdvancedFields = ({ errors, handleChange, values }) => (
  <>
    <Input
      errors={errors.recordLabel}
      label="Record Label"
      name="recordLabel"
      onChange={handleChange}
      type="text"
      value={values.recordLabel || ''}
    />
    <Input
      errors={errors.catNumber}
      hint="Your own identifier, if you have one."
      label="Catalogue Number"
      name="catNumber"
      onChange={handleChange}
      type="text"
      value={values.catNumber || ''}
    />
    <Input
      errors={errors.info}
      hint="Notable release information, e.g. press release copy, review quotes, equipment, concepts."
      label="Release Info"
      name="info"
      onChange={handleChange}
      type="textarea"
      value={values.info || ''}
    />
    <Input
      errors={errors.credits}
      hint="To credit writers, performers, producers, designers and engineers involved."
      label="Credits"
      name="credits"
      onChange={handleChange}
      element="textarea"
      value={values.credits || ''}
    />
    <div className="row p-0">
      <div className="col">
        <Input
          errors={errors.pubYear}
          label="Copyright Year"
          max={new Date().getFullYear()}
          name="pubYear"
          onChange={handleChange}
          type="number"
          value={values.pubYear || ''}
        />
      </div>
      <div className="col">
        <Input
          errors={errors.pubName}
          hint="i.e. Label, publisher or artist/individual."
          label="Copyright Owner"
          name="pubName"
          onChange={handleChange}
          type="text"
          value={values.pubName || ''}
        />
      </div>
    </div>
    <div className="row p-0">
      <div className="col">
        <Input
          errors={errors.recYear}
          hint="Year first released as a recording."
          label="Recording Copyright Year"
          max={new Date().getFullYear()}
          name="recYear"
          onChange={handleChange}
          type="number"
          value={values.recYear || ''}
        />
      </div>
      <div className="col">
        <Input
          errors={errors.recName}
          hint="i.e. Label or artist/individual."
          label="Recording Copyright Owner"
          name="recName"
          onChange={handleChange}
          type="text"
          value={values.recName || ''}
        />
      </div>
    </div>
  </>
);

AdvancedFields.propTypes = {
  errors: PropTypes.object,
  handleChange: PropTypes.func,
  values: PropTypes.object
};

export default AdvancedFields;
