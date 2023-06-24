import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { ChangeEventHandler, Dispatch, SetStateAction, memo, useCallback, useEffect, useState } from "react";
import { EssentialReleaseValues, ReleaseErrors } from "types";
import ArtistMenu from "./artistMenu";
import { DateTime } from "luxon";
import Field from "components/field";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";

interface Props {
  errors: ReleaseErrors;
  isEditing: boolean;
  savedState: EssentialReleaseValues;
  setErrors: Dispatch<SetStateAction<ReleaseErrors>>;
  updateState: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

const initialValues: EssentialReleaseValues = {
  artist: "",
  artistName: "",
  releaseTitle: "",
  releaseDate: DateTime.local().toISODate() || "",
  price: "10"
};

const EssentialInfo = ({ errors, isEditing, savedState, updateState }: Props) => {
  const { editing: release } = useSelector(state => state.releases, shallowEqual);
  const [values, setValues] = useState(initialValues);
  const { artist } = release;

  useEffect(() => {
    setValues(savedState);
  }, [savedState]);

  const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(e => {
    const { name, value } = e.currentTarget;

    if (name === "price") {
      const numbersOnly = value.replace(/[^0-9.]/g, "");
      setValues(current => ({ ...current, [name]: numbersOnly }));
    } else if (name === "artistName") {
      setValues(prev => ({ ...prev, [name]: value }));
    } else {
      setValues(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  return (
    <>
      <Heading>Essential Info</Heading>
      <SimpleGrid as="section" columns={[1, null, 2]} spacing={12}>
        <Box>
          {isEditing && artist ? (
            <Field isDisabled isReadOnly label="Artist name" name="artistName" values={values} size="lg" />
          ) : (
            <ArtistMenu error={errors.artistName} onChange={handleChange} updateRelease={updateState} values={values} />
          )}
          <Field
            errors={errors}
            isRequired
            label="Release Title"
            name="releaseTitle"
            onBlur={updateState}
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
            onBlur={updateState}
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
            onBlur={updateState}
            onChange={handleChange}
            values={values}
            size="lg"
          />
        </Box>
      </SimpleGrid>
    </>
  );
};

export default memo(EssentialInfo);
