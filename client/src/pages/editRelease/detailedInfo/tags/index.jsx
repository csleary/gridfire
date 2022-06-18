import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Tag,
  TagCloseButton,
  Text,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import Card from "components/card";
import Field from "components/field";
import Icon from "components/icon";
import PropTypes from "prop-types";
import { nanoid } from "@reduxjs/toolkit";
import { useState } from "react";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
const NUM_MAX_CHARS = 30;
const NUM_MAX_TAGS = 20;

const Tags = ({ handleChange, tags }) => {
  const [tagsInput, setTagsInput] = useState("");
  const [tagsError, setTagsError] = useState("");
  const keys = tags.map(() => nanoid(8));

  const handleTagsInput = event => {
    const { value } = event.target;
    if (value.length >= NUM_MAX_CHARS) return setTagsError(`Tag character limit (${NUM_MAX_CHARS}) reached!`);
    if (tags.length >= NUM_MAX_TAGS) return setTagsError(`Max limit of ${NUM_MAX_TAGS} tags reached.`);
    setTagsInput(value);
    setTagsError("");
  };

  const handleKeyPress = ({ key }) => {
    if (key === "Enter") {
      const tag = tagsInput
        .replace(/[^0-9a-z\s]/gi, "")
        .trim()
        .toLowerCase();

      if (!tag.length) return;
      const update = [...tags, tag];
      handleChange({ target: { name: "tags", value: update } });
      setTagsError("");
      setTagsInput("");
    }
  };

  const handleRemoveTag = indexToDelete => {
    const update = tags.filter((_, index) => index !== indexToDelete);
    handleChange({ target: { name: "tags", value: update } });
    setTagsError("");
    if (tags.length <= 20) setTagsInput("");
  };

  const handleClearTags = () => {
    handleChange({ target: { name: "tags", value: [] } });
    setTagsInput("");
    setTagsError("");
  };

  return (
    <Card as="section" p={4}>
      <FormControl>
        <FormLabel htmlFor="tags" color="gray.500" fontWeight={500}>
          Add Tags
        </FormLabel>
        <FormHelperText mb={1}>
          {tagsInput.length
            ? `Hit return to tag your release with \u2018${tagsInput}\u2019.`
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
          onKeyPress={handleKeyPress}
          value={tagsInput}
        />
        {tags.length ? (
          <Flex justifyContent="space-between" mb={4}>
            <Text>Tags set so far…</Text>
            <Button
              colorScheme="red"
              leftIcon={<Icon icon={faTimes} />}
              size="xs"
              isDisabled={!tags.length}
              onClick={handleClearTags}
              title={"Remove all currently set tags."}
              variant="ghost"
              ml={2}
            >
              Clear All
            </Button>
          </Flex>
        ) : (
          <Text>
            No tags currently set for this release. We strongly recommend setting some tags as they help with searching.
          </Text>
        )}
        <Wrap role="button" tabIndex="-1">
          {tags.map((tag, index) => (
            <WrapItem key={keys[index]}>
              <Tag whiteSpace="nowrap">
                {tag}
                <TagCloseButton onClick={() => handleRemoveTag(index)} title={`Click to delete \u2018${tag}\u2019.`} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </FormControl>
    </Card>
  );
};

Tags.propTypes = {
  input: PropTypes.object,
  handleChange: PropTypes.func,
  label: PropTypes.string,
  tags: PropTypes.array
};

export default Tags;
