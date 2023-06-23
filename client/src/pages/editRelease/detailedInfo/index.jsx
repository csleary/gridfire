import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { memo, useCallback, useEffect, useState } from "react";
import Field from "components/field";
import Tags from "./tags";

const initialValues = {
  info: "",
  credits: "",
  recordLabel: "",
  catNumber: "",
  pubYear: "",
  pubName: "",
  recYear: "",
  recName: "",
  tags: []
};

const DetailedInfo = ({ errors, handleRemoveTag, savedState, updateState }) => {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(savedState);
  }, [savedState]);

  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  return (
    <>
      <Heading as="h3">Optional Info</Heading>
      <SimpleGrid as="section" columns={[1, null, 2]} spacing={12}>
        <Box>
          <Field
            component="textarea"
            errors={errors}
            info="Notable release information, e.g. press release copy, review quotes, equipment, concepts."
            label="Release Info"
            name="info"
            onBlur={updateState}
            onChange={handleChange}
            values={values}
          />
          <Field
            component="textarea"
            errors={errors}
            info="Writers, performers, producers, designers and engineers involved."
            label="Credits"
            name="credits"
            onBlur={updateState}
            onChange={handleChange}
            values={values}
          />
          <Field errors={errors} label="Record Label" name="recordLabel" onChange={handleChange} values={values} />
          <Field
            errors={errors}
            info="Your own release identifier, if you have one."
            label="Catalogue Number"
            name="catNumber"
            onBlur={updateState}
            onChange={handleChange}
            values={values}
          />
        </Box>
        <Box>
          <Field
            errors={errors}
            label="Copyright Year"
            inputMode="numeric"
            name="pubYear"
            onBlur={updateState}
            onChange={handleChange}
            type="number"
            values={values}
          />
          <Field
            errors={errors}
            info="i.e. Label, publisher or artist/individual."
            label="Copyright Owner"
            name="pubName"
            onBlur={updateState}
            onChange={handleChange}
            values={values}
          />
          <Field
            errors={errors}
            info="Year first released as a recording."
            inputMode="numeric"
            label="Recording Copyright Year"
            name="recYear"
            onBlur={updateState}
            onChange={handleChange}
            type="number"
            values={values}
          />
          <Field
            errors={errors}
            info="i.e. Label or artist/individual."
            label="Recording Copyright Owner"
            name="recName"
            onBlur={updateState}
            onChange={handleChange}
            values={values}
          />
          <Tags handleChange={updateState} handleRemoveTag={handleRemoveTag} tags={savedState.tags} />
        </Box>
      </SimpleGrid>
    </>
  );
};

export default memo(DetailedInfo);
