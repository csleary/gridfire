import { Tag, Wrap, WrapItem } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import Icon from "components/icon";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { nanoid } from "@reduxjs/toolkit";
import { searchReleases } from "state/search";
import { useNavigate } from "react-router-dom";

const Tags = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tags } = useSelector(state => state.releases.activeRelease, shallowEqual);
  const keys = tags.map(() => nanoid(8));

  if (!tags.length) return null;
  const handleTagSearch = tag => {
    dispatch(searchReleases(tag));
    navigate("/search");
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
