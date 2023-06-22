import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import Field from "components/field";
import Tags from "./tags";
import { useEffect, useState } from "react";

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

const DetailedInfo = ({ errors, handleRemoveTag, savedValues, updateRelease }) => {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    if (savedValues) {
      setValues(savedValues);
    }
  }, [savedValues]);

  const handleChange = e => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

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
            onBlur={updateRelease}
            onChange={handleChange}
            values={values}
          />
          <Field
            component="textarea"
            errors={errors}
            info="Writers, performers, producers, designers and engineers involved."
            label="Credits"
            name="credits"
            onBlur={updateRelease}
            onChange={handleChange}
            values={values}
          />
          <Field errors={errors} label="Record Label" name="recordLabel" onChange={handleChange} values={values} />
          <Field
            errors={errors}
            info="Your own release identifier, if you have one."
            label="Catalogue Number"
            name="catNumber"
            onBlur={updateRelease}
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
            onBlur={updateRelease}
            onChange={handleChange}
            type="number"
            values={values}
          />
          <Field
            errors={errors}
            info="i.e. Label, publisher or artist/individual."
            label="Copyright Owner"
            name="pubName"
            onBlur={updateRelease}
            onChange={handleChange}
            values={values}
          />
          <Field
            errors={errors}
            info="Year first released as a recording."
            inputMode="numeric"
            label="Recording Copyright Year"
            name="recYear"
            onBlur={updateRelease}
            onChange={handleChange}
            type="number"
            values={values}
          />
          <Field
            errors={errors}
            info="i.e. Label or artist/individual."
            label="Recording Copyright Owner"
            name="recName"
            onBlur={updateRelease}
            onChange={handleChange}
            values={values}
          />
          <Tags handleChange={updateRelease} handleRemoveTag={handleRemoveTag} tags={savedValues.tags} />
        </Box>
      </SimpleGrid>
    </>
  );
};

export default DetailedInfo;
