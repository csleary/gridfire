import { Button, ButtonGroup, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import { faSort } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

const sortOptions = [
  { title: "Date Added", sortPath: "createdAt", 1: "Old", "-1": "New" },
  {
    title: "Release Date",
    sortPath: "releaseDate",
    1: "Old",
    "-1": "New"
  },
  {
    title: "Artist Name",
    sortPath: "artistName",
    1: "A\u2013Z",
    "-1": "Z\u2013A"
  },
  {
    title: "Release Title",
    sortPath: "releaseTitle",
    1: "A\u2013Z",
    "-1": "Z\u2013A"
  },
  { title: "Price", sortPath: "price", "-1": "Desc.", 1: "Asc." }
];

const SortReleases = ({
  handleFetchCatalogue,
  currentSortOrder,
  currentSortPath,
  setCurrentSortOrder,
  setCurrentSortPath
}) => {
  const [isSorting, setIsSorting] = useState(false);

  const handleSortPath = async sortBy => {
    setIsSorting(true);
    await handleFetchCatalogue({ sortBy, sortOrder: currentSortOrder });
    setCurrentSortPath(sortBy);
    setIsSorting(false);
  };

  const handleSortOrder = async sortOrder => {
    setIsSorting(true);
    await handleFetchCatalogue({ sortBy: currentSortPath, sortOrder });
    setCurrentSortOrder(sortOrder);
    setIsSorting(false);
  };

  return (
    <ButtonGroup size="sm" isAttached mb={4}>
      <Menu>
        <MenuButton as={Button} leftIcon={<FontAwesomeIcon icon={faSort} />}>
          {sortOptions.find(option => option.sortPath === currentSortPath).title}
        </MenuButton>
        <MenuList>
          {sortOptions.map(option => (
            <MenuItem key={option.title} onClick={() => handleSortPath(option.sortPath)}>
              {option.title}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      <Button isLoading={isSorting} onClick={() => handleSortOrder(currentSortOrder * -1)} spinnerPlacement="end">
        {`(${sortOptions.find(option => option.sortPath === currentSortPath)[currentSortOrder.toString()]})`}
      </Button>
    </ButtonGroup>
  );
};

SortReleases.propTypes = {
  handleFetchCatalogue: PropTypes.func,
  currentSortPath: PropTypes.string,
  setCurrentSortPath: PropTypes.func,
  currentSortOrder: PropTypes.number,
  setCurrentSortOrder: PropTypes.func
};

export default SortReleases;
