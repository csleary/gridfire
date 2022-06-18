import { Box, Flex, Heading } from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";
import ArtistMenu from "./artistMenu";
import Field from "components/field";
import { useCallback, useState } from "react";

const EssentialInfo = ({ errors, handleChange, isEditing, setErrors, setValues, values }) => {
  const { artists } = useSelector(state => state.artists, shallowEqual);
  const { activeRelease: release } = useSelector(state => state.releases, shallowEqual);
  const [showNewArtistName, setShowNewArtistName] = useState(false);
  const { artist, artistName } = release;

  const handleChangePrice = useCallback(
    ({ target: { name, value } }) => {
      setErrors(({ [name]: key, ...rest }) => rest);
      const numbersOnly = value.replace(/[^0-9.]/g, "");
      setValues(current => ({ ...current, [name]: numbersOnly }));
    },
    [setErrors, setValues]
  );

  const formatPrice = () => {
    setValues(current => {
      const [integer = 0, float = 0] = current.price.toString().split(".");
      const priceAsFloatString = `${integer}.${float}`;
      const rounded = +(Math.ceil(Math.abs(priceAsFloatString) + "e+2") + "e-2");
      const price = Number.isNaN(rounded) ? Number.MAX_SAFE_INTEGER.toFixed(2) : rounded.toFixed(2);
      return { ...current, price };
    });
  };

  return (
    <>
      <Heading>Essential Info</Heading>
      <Flex as="section">
        <Box flex="1 1 50%" mr={12}>
          {isEditing && artist ? (
            <Field isDisabled isReadOnly label="Artist name" value={artistName} size="lg" />
          ) : (
            <>
              {artists.length ? (
                <ArtistMenu
                  error={errors.artist}
                  label="Artist name"
                  name="artist"
                  onChange={e => {
                    setErrors(({ artist, artistName, ...rest }) => rest);
                    handleChange(e);
                  }}
                  setShowNewArtist={setShowNewArtistName}
                  showNewArtistName={showNewArtistName}
                  value={values.artist}
                />
              ) : null}
              {!artists.length || showNewArtistName ? (
                <Field
                  errors={errors}
                  isRequired
                  label={artists.length ? "New artist name" : "Artist name"}
                  name="artistName"
                  onChange={e => {
                    setErrors(({ artist, artistName, ...rest }) => rest);
                    handleChange(e);
                  }}
                  values={values}
                  size="lg"
                />
              ) : null}
            </>
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
        <Box flex="1 1 50%">
          <Field
            errors={errors}
            isRequired
            label="Release Date"
            name="releaseDate"
            onChange={handleChange}
            type="date"
            value={(values.releaseDate || new Date(Date.now()).toISOString()).split("T")[0]}
            size="lg"
          />
          <Field
            errors={errors}
            info="We will round this up to the nearest penny."
            inputMode="numeric"
            isRequired
            label="Price (DAI/USD)"
            name="price"
            onBlur={formatPrice}
            onChange={handleChangePrice}
            type="text"
            values={values}
            size="lg"
          />
        </Box>
      </Flex>
    </>
  );
};

export default EssentialInfo;
