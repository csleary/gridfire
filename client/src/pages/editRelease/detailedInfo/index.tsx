import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { ChangeEventHandler, memo, useCallback } from "react";
import { useDispatch, useSelector } from "hooks";
import Field from "components/field";
import Tags from "./tags";
import { shallowEqual } from "react-redux";
import { updateRelease } from "state/editor";

const DetailedInfo = () => {
  const dispatch = useDispatch();
  const { release } = useSelector(state => state.editor, shallowEqual);
  const { catNumber, credits, info, pubYear, pubName, recordLabel, recYear, recName } = release;

  const handleChange: ChangeEventHandler<HTMLInputElement & HTMLTextAreaElement> = useCallback(
    e => {
      const { checked, name, type, value } = e.currentTarget;
      dispatch(updateRelease({ checked, name, type, value }));
    },
    [dispatch]
  );

  return (
    <>
      <Heading as="h3">Optional Info</Heading>
      <SimpleGrid as="section" columns={[1, null, 2]} spacing={12}>
        <Box>
          <Field
            component="textarea"
            info="Notable release information, e.g. press release copy, review quotes, equipment, concepts."
            label="Release Info"
            name="info"
            onChange={handleChange}
            value={info}
          />
          <Field
            component="textarea"
            info="Writers, performers, producers, designers and engineers involved."
            label="Credits"
            name="credits"
            onChange={handleChange}
            value={credits}
          />
          <Field label="Record Label" name="recordLabel" onChange={handleChange} value={recordLabel} />
          <Field
            info="Your own release identifier, if you have one."
            label="Catalogue Number"
            name="catNumber"
            onChange={handleChange}
            value={catNumber}
          />
        </Box>
        <Box>
          <Field
            label="Copyright Year"
            inputMode="numeric"
            name="pubYear"
            onChange={handleChange}
            type="number"
            value={pubYear}
          />
          <Field
            info="i.e. Label, publisher or artist/individual."
            label="Copyright Owner"
            name="pubName"
            onChange={handleChange}
            value={pubName}
          />
          <Field
            info="Year first released as a recording."
            inputMode="numeric"
            label="Recording Copyright Year"
            name="recYear"
            onChange={handleChange}
            type="number"
            value={recYear}
          />
          <Field
            info="i.e. Label or artist/individual."
            label="Recording Copyright Owner"
            name="recName"
            onChange={handleChange}
            value={recName}
          />
          <Tags />
        </Box>
      </SimpleGrid>
    </>
  );
};

export default memo(DetailedInfo);
