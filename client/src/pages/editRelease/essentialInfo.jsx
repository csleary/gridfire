import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";
import ArtistMenu from "./artistMenu";
import { DateTime } from "luxon";
import Field from "components/field";
import { formatPrice } from "utils";
import { useCallback } from "react";

const EssentialInfo = ({ errors, handleChange, isEditing, setErrors, setValues, values }) => {
  const { editing: release } = useSelector(state => state.releases, shallowEqual);
  const { artist, artistName } = release;
  const releaseDate = DateTime.fromISO(values.releaseDate).toISODate();

  const handleChangePrice = useCallback(
    ({ target: { name, value } }) => {
      setErrors(({ [name]: key, ...rest }) => rest);
      const numbersOnly = value.replace(/[^0-9.]/g, "");
      setValues(current => ({ ...current, [name]: numbersOnly }));
    },
    [setErrors, setValues]
  );

  const handleBlur = () => {
    setValues(current => ({ ...current, price: formatPrice(current.price) }));
  };

  return (
    <>
      <Heading>Essential Info</Heading>
      <SimpleGrid as="section" columns={[1, null, 2]} spacing={12}>
        <Box>
          {isEditing && artist ? (
            <Field isDisabled isReadOnly label="Artist name" value={artistName} size="lg" />
          ) : (
            <ArtistMenu
              error={errors.artistName}
              onChange={e => {
                setErrors(({ artist, artistName, ...rest }) => rest);
                handleChange(e);
              }}
              value={values.artist || values.artistName}
            />
          )}
          <Field
            errors={errors}
            isRequired
            label="Release Title"
            name="releaseTitle"
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
            onChange={handleChange}
            type="date"
            value={releaseDate}
            size="lg"
          />
          <Field
            errors={errors}
            info="We will round this up to the nearest penny. Set to zero for 'name your price'."
            inputMode="numeric"
            isRequired
            label="Price (DAI/USD)"
            name="price"
            onBlur={handleBlur}
            onChange={handleChangePrice}
            type="text"
            values={values}
            size="lg"
          />
        </Box>
      </SimpleGrid>
    </>
  );
};

export default EssentialInfo;
