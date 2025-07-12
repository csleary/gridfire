import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { ChangeEventHandler, useCallback } from "react";
import { shallowEqual } from "react-redux";

import Field from "@/components/field";
import { useDispatch, useSelector } from "@/hooks";
import { setFormattedPrice, updateRelease } from "@/state/editor";

import ArtistMenu from "./artistMenu";

interface Props {
  isEditing: boolean;
}

const EssentialInfo = ({ isEditing }: Props) => {
  const dispatch = useDispatch();
  const artist = useSelector(state => state.editor.release.artist);
  const artistName = useSelector(state => state.editor.release.artistName);
  const price = useSelector(state => state.editor.release.price);
  const releaseDate = useSelector(state => state.editor.release.releaseDate);
  const releaseErrors = useSelector(state => state.editor.releaseErrors, shallowEqual);
  const releaseTitle = useSelector(state => state.editor.release.releaseTitle);

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
            <Field isDisabled isReadOnly label="Artist name" name="artistName" size="lg" value={artistName} />
          ) : (
            <ArtistMenu />
          )}
          <Field
            error={releaseErrors.releaseTitle}
            isRequired
            label="Release Title"
            name="releaseTitle"
            onChange={handleChange}
            size="lg"
            value={releaseTitle}
          />
        </Box>
        <Box>
          <Field
            error={releaseErrors.releaseDate}
            isRequired
            label="Release Date"
            name="releaseDate"
            onChange={handleChange}
            size="lg"
            type="date"
            value={releaseDate}
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
            size="lg"
            value={price}
          />
        </Box>
      </SimpleGrid>
    </>
  );
};

export default EssentialInfo;
