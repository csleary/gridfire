import Icon from "@/components/icon";
import { useSelector } from "@/hooks";
import { Tag, Wrap, WrapItem } from "@chakra-ui/react";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { nanoid } from "@reduxjs/toolkit";
import { shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";

const Tags = () => {
  const navigate = useNavigate();
  const tags = useSelector(state => state.releases.activeRelease.tags, shallowEqual);
  const keys = tags.map(() => nanoid(8));

  if (!tags.length) return null;

  const handleTagSearch = (tag: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append("tag", tag);
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <Wrap spacing={2}>
      <WrapItem alignItems={"center"}>
        <Icon color="gray.500" icon={faTags} />
      </WrapItem>
      {tags.map((tag, index) => (
        <WrapItem key={keys[index]}>
          <Tag
            onClick={() => handleTagSearch(tag)}
            role="button"
            title={`Click to see more releases tagged with '${tag}'.`}
            whiteSpace="nowrap"
          >
            {tag}
          </Tag>
        </WrapItem>
      ))}
    </Wrap>
  );
};

export default Tags;
