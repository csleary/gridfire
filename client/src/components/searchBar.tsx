import {
  Box,
  Button,
  Fade,
  IconButton,
  Image,
  Input,
  InputLeftElement,
  InputRightElement,
  InputGroup,
  LinkBox,
  LinkOverlay,
  Modal,
  ModalContent,
  ModalBody,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { clearResults, searchReleases } from "state/search";
import { faBackspace, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "hooks";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { CLOUD_URL } from "index";
import Icon from "components/icon";
import debounce from "lodash.debounce";
import { shallowEqual } from "react-redux";
import { useDisclosure } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { usePrevious } from "hooks/usePrevious";

interface Release {
  _id: string;
  artistName: string;
  artwork: { cid: string };
  catNumber: string;
  info: string;
  price: string;
  recordLabel: string;
  releaseTitle: string;
  trackList: Array<{}>;
}

const SearchBar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const metaColour = useColorModeValue("gray.500", "gray.400");
  const dispatch = useDispatch();
  const { search } = useLocation();
  const navigate = useNavigate();
  const inputRef: any = useRef();
  const { isSearching, searchQuery, searchResults } = useSelector(state => state.search, shallowEqual);
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
    inputRef.current.focus();
  };

  const handleClose = () => {
    onClose();
    setSearchText("");
  };

  return (
    <>
      <Button leftIcon={<Icon icon={faSearch} maxW="32rem" />} onClick={onOpen}>
        <Text>Search</Text>
      </Button>
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent overflow="none" rounded="md" p={4}>
          <InputGroup size="lg">
            <InputLeftElement
              children={isSearching ? <Spinner /> : <Icon icon={faSearch} />}
              color="gray.400"
              pointerEvents="none"
            />
            <Input
              paddingLeft={12}
              paddingRight={12}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              ref={el => (inputRef.current = el)}
              value={searchText}
              variant="flushed"
            />
            <InputRightElement>
              <Fade in={Boolean(searchText)}>
                <IconButton
                  aria-label="Clear the search term."
                  color="gray.400"
                  icon={<Icon icon={faBackspace} />}
                  onClick={handleClearSearch}
                  size="sm"
                  variant="unstyled"
                  _hover={{ color: useColorModeValue("gray.800", "gray.200") }}
                />
              </Fade>
            </InputRightElement>
          </InputGroup>
          <ModalBody p={0} mt={6}>
            <VStack spacing={4} alignItems="stretch" role="listbox">
              {searchResults.length ? (
                searchResults.map((release: Release) => {
                  const {
                    _id: releaseId,
                    artistName,
                    artwork: { cid },
                    catNumber,
                    info,
                    price,
                    recordLabel,
                    releaseTitle,
                    trackList
                  } = release;

                  return (
                    <LinkBox key={releaseId} role="option">
                      <Wrap alignItems="center" justify={["center", "flex-start"]}>
                        <WrapItem>
                          <Image
                            boxSize="8rem"
                            objectFit="cover"
                            loading="lazy"
                            rounded="full"
                            src={`${CLOUD_URL}/${cid}`}
                          />
                        </WrapItem>
                        <WrapItem flex="1 1 32ch">
                          <LinkOverlay as={Link} to={`/release/${releaseId}`} flex={1} p={4} onClick={onClose}>
                            <Box>
                              <Text fontSize="2xl" fontStyle="italic" noOfLines={2}>
                                {releaseTitle}
                              </Text>
                              <Text fontSize="xl" fontWeight="300" noOfLines={2}>
                                {artistName}
                              </Text>
                              <Text color={metaColour}>
                                {recordLabel} {recordLabel ? <>&bull;</> : null} {catNumber}
                              </Text>
                              {Number(price) === 0 ? (
                                <Text color={metaColour}>Name your price</Text>
                              ) : (
                                <Text color={metaColour}>◈{price}</Text>
                              )}
                              <Text color={metaColour}>
                                {trackList.length} track{trackList.length > 1 ? "s" : ""}
                              </Text>
                              <Text noOfLines={6}>{info}</Text>
                            </Box>
                          </LinkOverlay>
                        </WrapItem>
                      </Wrap>
                    </LinkBox>
                  );
                })
              ) : isSearching ? (
                <Text>Searching for &lsquo;{searchQuery} &rsquo;…</Text>
              ) : searchQuery && !searchResults.length ? (
                <Text>Nothing found for &lsquo;{searchQuery} &rsquo;.</Text>
              ) : null}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SearchBar;
