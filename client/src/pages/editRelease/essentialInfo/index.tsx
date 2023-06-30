import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { ChangeEventHandler, useCallback } from "react";
import { useDispatch, useSelector } from "hooks";
import ArtistMenu from "./artistMenu";
import Field from "components/field";
import { shallowEqual } from "react-redux";
import { setFormattedPrice, updateRelease } from "state/editor";

interface Props {
  isEditing: boolean;
}

const EssentialInfo = ({ isEditing }: Props) => {
  const dispatch = useDispatch();
  const { release, releaseErrors } = useSelector(state => state.editor, shallowEqual);
  const { artist, artistName, price, releaseDate, releaseTitle } = release;

  const handleChange: ChangeEventHandler<HTMLInputElement & HTMLTextAreaElement> = useCallback(
    e => {
      const { checked, name, type, value } = e.currentTarget;
      dispatch(updateRelease({ checked, name, type, value }));
    },
    [dispatch]
  );

  return (
    <>
      <Heading>Essential Info</Heading>
      <SimpleGrid as="section" columns={[1, null, 2]} spacing={12}>
        <Box>
          {isEditing && artist ? (
            <Field isDisabled isReadOnly label="Artist name" name="artistName" value={artistName} size="lg" />
          ) : (
            <ArtistMenu />
          )}
          <Field
            error={releaseErrors.releaseTitle}
            isRequired
            label="Release Title"
            name="releaseTitle"
            onChange={handleChange}
            value={releaseTitle}
            size="lg"
          />
        </Box>
        <Box>
          <Field
            error={releaseErrors.releaseDate}
            isRequired
            label="Release Date"
            name="releaseDate"
            onChange={handleChange}
            type="date"
            value={releaseDate}
            size="lg"
          />
          <Field
            error={releaseErrors.price}
            info="We will round this up to the nearest penny. Set to zero for 'name your price'."
            inputMode="numeric"
            isRequired
            label="Price (DAI/USD)"
            name="price"
            onBlur={() => dispatch(setFormattedPrice())}
            onChange={handleChange}
            value={price}
            size="lg"
          />
        </Box>
      </SimpleGrid>
    </>
  );
};

export default EssentialInfo;
