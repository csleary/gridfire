import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import ArtistMenu from "./artistMenu";
import Field from "components/field";

const initialValues = {
  artist: "",
  artistName: "",
  releaseTitle: "",
  releaseDate: "",
  price: ""
};

const EssentialInfo = ({ errors, isEditing, savedValues, setErrors, updateRelease }) => {
  const { editing: release } = useSelector(state => state.releases, shallowEqual);
  const [values, setValues] = useState(initialValues);
  const { artist } = release;

  useEffect(() => {
    if (savedValues) {
      setValues(savedValues);
    }
  }, [savedValues]);

  const handleChange = e => {
    const { name, value } = e.target;

    if (name === "price") {
      const numbersOnly = value.replace(/[^0-9.]/g, "");
      setErrors(({ [name]: key, ...rest }) => rest);
      setValues(current => ({ ...current, [name]: numbersOnly }));
    } else if (name === "artistName") {
      setErrors(({ artist, artistName, ...rest }) => rest);
      setValues(prev => ({ ...prev, [name]: value }));
    } else {
      setErrors(({ [name]: key, ...rest }) => rest);
      setValues(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <>
      <Heading>Essential Info</Heading>
      <SimpleGrid as="section" columns={[1, null, 2]} spacing={12}>
        <Box>
          {isEditing && artist ? (
            <Field isDisabled isReadOnly label="Artist name" name="artistName" values={values} size="lg" />
          ) : (
            <ArtistMenu
              error={errors.artistName}
              onChange={handleChange}
              updateRelease={updateRelease}
              values={values}
            />
          )}
          <Field
            errors={errors}
            isRequired
            label="Release Title"
            name="releaseTitle"
            onBlur={updateRelease}
            onChange={handleChange}
            values={values}
            size="lg"
          />
        </Box>
        <Box>
          <Field
            errors={errors}
            isRequired
            label="Release Date"
            name="releaseDate"
            onBlur={updateRelease}
            onChange={handleChange}
            type="date"
            values={values}
            size="lg"
          />
          <Field
            errors={errors}
            info="We will round this up to the nearest penny. Set to zero for 'name your price'."
            inputMode="numeric"
            isRequired
            label="Price (DAI/USD)"
            name="price"
            onBlur={updateRelease}
            onChange={handleChange}
            values={values}
            size="lg"
          />
        </Box>
      </SimpleGrid>
    </>
  );
};

export default EssentialInfo;
