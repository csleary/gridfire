import {
  Box,
  Button,
  Image,
  LinkBox,
  LinkOverlay,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { ReleaseTrack } from "@gridfire/shared/types";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useState } from "react";
import { shallowEqual } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import Icon from "@/components/icon";
import SearchInput from "@/components/searchInput";
import { useDispatch, useSelector } from "@/hooks";
import { usePrevious } from "@/hooks/usePrevious";
import { searchReleases } from "@/state/search";

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;

interface Release {
  _id: string;
  artistName: string;
  artwork: { status: string };
  catNumber: string;
  info: string;
  price: string;
  recordLabel: string;
  releaseTitle: string;
  trackList: ReleaseTrack[];
}

const SearchBar = ({ ...rest }) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const metaColour = useColorModeValue("gray.500", "gray.400");
  const dispatch = useDispatch();
  const { search } = useLocation();
  const isSearching = useSelector(state => state.search.isSearching);
  const searchQuery = useSelector(state => state.search.searchQuery);
  const searchResults = useSelector(state => state.search.searchResults, shallowEqual);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const listQuery = [];
    for (const [key, value] of searchParams.entries()) listQuery.push(`${key}:${value}`);
    const stringQuery = listQuery.join(",");
    if (stringQuery) dispatch(searchReleases(stringQuery));
  }, [dispatch, search]);

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

  const handleClose = () => {
    onClose();
    setSearchText("");
  };

  return (
    <>
      <Button leftIcon={<Icon icon={faSearch} maxW="32rem" />} onClick={onOpen} {...rest}>
        Search
      </Button>
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent overflow="none" p={4} rounded="md">
          <SearchInput />
          <ModalBody mt={6} p={0}>
            <VStack alignItems="stretch" role="listbox" spacing={4}>
              {searchResults.length ? (
                searchResults.map((release: Release) => {
                  const {
                    _id: releaseId,
                    artistName,
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
                            loading="lazy"
                            objectFit="cover"
                            rounded="full"
                            src={`${VITE_CDN_IMG}/${releaseId}`}
                          />
                        </WrapItem>
                        <WrapItem flex="1 1 32ch">
                          <LinkOverlay as={Link} flex={1} onClick={onClose} p={4} to={`/release/${releaseId}`}>
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
