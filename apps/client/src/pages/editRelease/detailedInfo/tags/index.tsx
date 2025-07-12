import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Tag,
  TagCloseButton,
  Text,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ChangeEvent, KeyboardEvent, MouseEvent, useState } from "react";
import { shallowEqual } from "react-redux";

import Card from "@/components/card";
import Field from "@/components/field";
import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { removeTag, removeTags, updateRelease } from "@/state/editor";

const NUM_MAX_CHARS = 30;
const NUM_MAX_TAGS = 20;

const Tags = () => {
  const dispatch = useDispatch();
  const tags = useSelector(state => state.editor.release.tags, shallowEqual);
  const [tagsInput, setTagsInput] = useState("");
  const [tagsError, setTagsError] = useState("");

  const handleTagsInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = e.currentTarget;
    if (value.length >= NUM_MAX_CHARS) return setTagsError(`Tag character limit (${NUM_MAX_CHARS}) reached!`);
    if (tags.length >= NUM_MAX_TAGS) return setTagsError(`Max limit of ${NUM_MAX_TAGS} tags reached.`);
    setTagsInput(value);
    setTagsError("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const { currentTarget, key } = e;
    const { name, value } = currentTarget;

    if (key === "Enter") {
      dispatch(updateRelease({ name, value }));
      setTagsError("");
      setTagsInput("");
    }
  };

  const handleRemoveTags = (e: MouseEvent<HTMLButtonElement>) => {
    dispatch(removeTags());
    setTagsInput("");
    setTagsError("");
  };

  return (
    <Card as="section" p={4}>
      <FormControl>
        <FormLabel color="gray.500" fontWeight={500} htmlFor="tags">
          Add Tags
        </FormLabel>
        <FormHelperText mb={1}>
          {tagsInput.length
            ? `Hit return to tag your release with '${tagsInput}'.`
            : "Enter a tag for your release below:"}
        </FormHelperText>
        <Field
          error={tagsError}
          info={
            <>
              e.g. Genres, styles, prominent instruments, or guest artists, remixers, conductors etc.
              <br />
              {NUM_MAX_TAGS} tag max, {NUM_MAX_CHARS} characters per tag.
            </>
          }
          mb={2}
          name="tags"
          onChange={handleTagsInput}
          onKeyDown={handleKeyDown}
          value={tagsInput}
        />
        {tags.length ? (
          <Flex justifyContent="space-between" mb={4}>
            <Text>Tags set so far…</Text>
            <Button
              colorScheme="red"
              isDisabled={!tags.length}
              leftIcon={<Icon icon={faTimes} />}
              ml={2}
              name="removeTags"
              onClick={handleRemoveTags}
              size="xs"
              title={"Remove all currently set tags."}
              variant="ghost"
            >
              Clear All
            </Button>
          </Flex>
        ) : (
          <Text>
            No tags currently set for this release. We strongly recommend setting some tags as they help with searching.
          </Text>
        )}
        <Wrap role="button" tabIndex={-1}>
          {tags.map((tag: string) => (
            <WrapItem key={tag}>
              <Tag whiteSpace="nowrap">
                {tag}
                <TagCloseButton onClick={() => void dispatch(removeTag(tag))} title={`Click to delete '${tag}'.`} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </FormControl>
    </Card>
  );
};

export default Tags;
