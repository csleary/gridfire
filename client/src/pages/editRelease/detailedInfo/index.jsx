import { Box, Flex, Heading } from "@chakra-ui/react";
import Field from "components/field";
import PropTypes from "prop-types";
import Tags from "./tags";
import { memo } from "react";

const DetailedInfo = ({ errors, handleChange, values }) => (
  <>
    <Heading as="h3">Optional Info</Heading>
    <Flex as="section">
      <Box flex="1 1 50%" mr={12}>
        <Field
          component="textarea"
          errors={errors}
          info="Notable release information, e.g. press release copy, review quotes, equipment, concepts."
          label="Release Info"
          name="info"
          onChange={handleChange}
          values={values}
        />
        <Field
          component="textarea"
          errors={errors}
          info="Writers, performers, producers, designers and engineers involved."
          label="Credits"
          name="credits"
          onChange={handleChange}
          values={values}
        />
        <Field errors={errors} label="Record Label" name="recordLabel" onChange={handleChange} values={values} />
        <Field
          errors={errors}
          info="Your own release identifier, if you have one."
          label="Catalogue Number"
          name="catNumber"
          onChange={handleChange}
          values={values}
        />
      </Box>
      <Box flex="1 1 50%">
        <Field
          errors={errors}
          label="Copyright Year"
          max={new Date().getFullYear()}
          name="pubYear"
          onChange={handleChange}
          type="number"
          values={values}
        />
        <Field
          errors={errors}
          info="i.e. Label, publisher or artist/individual."
          label="Copyright Owner"
          name="pubName"
          onChange={handleChange}
          values={values}
        />
        <Field
          errors={errors}
          info="Year first released as a recording."
          label="Recording Copyright Year"
          max={new Date().getFullYear()}
          name="recYear"
          onChange={handleChange}
          type="number"
          values={values}
        />
        <Field
          errors={errors}
          info="i.e. Label or artist/individual."
          label="Recording Copyright Owner"
          name="recName"
          onChange={handleChange}
          values={values}
        />
        <Tags handleChange={handleChange} tags={values.tags || []} />
      </Box>
    </Flex>
  </>
);

DetailedInfo.propTypes = {
  errors: PropTypes.object,
  handleChange: PropTypes.func,
  values: PropTypes.object
};

const stringify = obj => Object.entries(obj).flat().join(", ");

export default memo(DetailedInfo, (prev, next) => {
  return (
    stringify(prev.errors) === stringify(next.errors) &&
    stringify(prev.values) === stringify(next.values) &&
    prev.handleChange === next.handleChange
  );
});