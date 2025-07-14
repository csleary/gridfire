import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { EditorRelease } from "@gridfire/shared/types";
import { ChangeEventHandler, useCallback } from "react";

import Field from "@/components/field";
import { useDispatch, useSelector } from "@/hooks";
import { updateRelease } from "@/state/editor";

import Tags from "./tags";

const DetailedInfo = () => {
  const dispatch = useDispatch();
  const catNumber = useSelector(state => state.editor.release.catNumber);
  const credits = useSelector(state => state.editor.release.credits);
  const info = useSelector(state => state.editor.release.info);
  const pubName = useSelector(state => state.editor.release.pubName);
  const pubYear = useSelector(state => state.editor.release.pubYear);
  const recName = useSelector(state => state.editor.release.recName);
  const recordLabel = useSelector(state => state.editor.release.recordLabel);
  const recYear = useSelector(state => state.editor.release.recYear);

  const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
    e => {
      const { name, value } = e.currentTarget;
      dispatch(updateRelease({ name: name as keyof Omit<EditorRelease, "artwork" | "published">, value }));
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
            inputMode="numeric"
            label="Copyright Year"
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

export default DetailedInfo;
