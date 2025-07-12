import { Button, ButtonGroup, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

type SortOrder = "1" | "-1";

const sortOptions = [
  { "-1": "New", 1: "Old", sortPath: "createdAt", title: "Date Added" },
  { "-1": "New", 1: "Old", sortPath: "releaseDate", title: "Release Date" },
  { "-1": "Z\u2013A", 1: "A\u2013Z", sortPath: "artistName", title: "Artist Name" },
  { "-1": "Z\u2013A", 1: "A\u2013Z", sortPath: "releaseTitle", title: "Release Title" },
  { "-1": "Desc.", 1: "Asc.", sortPath: "price", title: "Price" }
];

interface Props {
  currentSortOrder: string;
  currentSortPath: string;
  handleFetchCatalogue: (options?: { isPaging?: boolean; sortBy?: string; sortOrder?: string; }) => Promise<void>;
  setCurrentSortOrder: (sortOrder: string) => void;
  setCurrentSortPath: (sortPath: string) => void;
}

const SortReleases = ({
  currentSortOrder,
  currentSortPath,
  handleFetchCatalogue,
  setCurrentSortOrder,
  setCurrentSortPath
}: Props) => {
  const [isSorting, setIsSorting] = useState(false);

  const handleSortPath = async (sortBy: string) => {
    setIsSorting(true);
    await handleFetchCatalogue({ sortBy, sortOrder: currentSortOrder });
    setCurrentSortPath(sortBy);
    setIsSorting(false);
  };

  const handleSortOrder = async (sortOrder: string) => {
    setIsSorting(true);
    await handleFetchCatalogue({ sortBy: currentSortPath, sortOrder });
    setCurrentSortOrder(sortOrder);
    setIsSorting(false);
  };

  const currentSortOption = sortOptions.find(option => option?.sortPath === currentSortPath);
  const currentSortOrderText = currentSortOption?.[currentSortOrder as SortOrder];

  return (
    <ButtonGroup isAttached mb={4} size="sm">
      <Menu>
        <MenuButton as={Button} leftIcon={<FontAwesomeIcon icon={faSort} />}>
          {sortOptions.find(option => option.sortPath === currentSortPath)?.title}
        </MenuButton>
        <MenuList>
          {sortOptions.map(option => (
            <MenuItem key={option.title} onClick={() => handleSortPath(option.sortPath)}>
              {option.title}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      <Button
        isLoading={isSorting}
        onClick={() => handleSortOrder((Number(currentSortOrder) * -1).toString())}
        spinnerPlacement="end"
      >
        {currentSortOrderText}
      </Button>
    </ButtonGroup>
  );
};

export default SortReleases;
