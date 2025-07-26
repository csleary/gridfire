import {
  ChakraProps,
  Fade,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  useColorModeValue
} from "@chakra-ui/react";
import { faBackspace, faSearch } from "@fortawesome/free-solid-svg-icons";
import debounce from "lodash.debounce";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { usePrevious } from "@/hooks/usePrevious";
import { clearResults, searchReleases } from "@/state/search";

const SearchInput = (props: ChakraProps) => {
  const dispatch = useDispatch();
  const { search } = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isSearching = useSelector(state => state.search.isSearching);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const listQuery = [];
    for (const [key, value] of searchParams.entries()) listQuery.push(`${key}:${value}`);
    const stringQuery = listQuery.join(",");
    if (stringQuery) dispatch(searchReleases(stringQuery));
  }, [dispatch, search]);

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
      navigate("/search");
    }
  };

  // eslint-disable-next-line
  const handleSearch = useCallback(
    debounce(query => void dispatch(searchReleases(query)), 500),
    []
  );

  const previousQuery = usePrevious(searchText);

  useEffect(() => {
    if (searchText.length && searchText !== previousQuery) {
      handleSearch(searchText);
    }
  }, [handleSearch, previousQuery, searchText]);

  const handleSearchInput = (e: FormEvent<HTMLInputElement>) => setSearchText(e.currentTarget.value);

  const handleClearSearch = () => {
    dispatch(clearResults());
    setSearchText("");
    inputRef.current?.focus();
  };

  return (
    <InputGroup size="lg" {...props}>
      <InputLeftElement color="gray.400" pointerEvents="none">
        {isSearching ? <Spinner /> : <Icon icon={faSearch} />}
      </InputLeftElement>
      <Input
        autoFocus
        onChange={handleSearchInput}
        onKeyDown={handleKeyDown}
        paddingLeft={12}
        paddingRight={12}
        placeholder="Enter a search term…"
        ref={el => void (inputRef.current = el)}
        value={searchText}
        variant="flushed"
      />
      <InputRightElement>
        <Fade in={Boolean(searchText)}>
          <IconButton
            _hover={{ color: useColorModeValue("gray.800", "gray.200") }}
            aria-label="Clear the search term."
            color="gray.400"
            icon={<Icon icon={faBackspace} />}
            onClick={handleClearSearch}
            size="sm"
            variant="unstyled"
          />
        </Fade>
      </InputRightElement>
    </InputGroup>
  );
};

export default SearchInput;
