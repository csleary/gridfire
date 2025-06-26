import { Button, ButtonGroup, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

type SortOrder = "-1" | "1";

const sortOptions = [
  { title: "Date Added", sortPath: "createdAt", 1: "Old", "-1": "New" },
  { title: "Release Date", sortPath: "releaseDate", 1: "Old", "-1": "New" },
  { title: "Artist Name", sortPath: "artistName", 1: "A\u2013Z", "-1": "Z\u2013A" },
  { title: "Release Title", sortPath: "releaseTitle", 1: "A\u2013Z", "-1": "Z\u2013A" },
  { title: "Price", sortPath: "price", "-1": "Desc.", 1: "Asc." }
];

interface Props {
  handleFetchCatalogue: (options?: { sortBy?: string; sortOrder?: string; isPaging?: boolean }) => Promise<void>;
  currentSortOrder: string;
  currentSortPath: string;
  setCurrentSortOrder: (sortOrder: string) => void;
  setCurrentSortPath: (sortPath: string) => void;
}

const SortReleases = ({
  handleFetchCatalogue,
  currentSortOrder,
  currentSortPath,
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
    <ButtonGroup size="sm" isAttached mb={4}>
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
