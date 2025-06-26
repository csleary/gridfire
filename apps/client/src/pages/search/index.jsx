import Grid from "@/components/grid";
import RenderRelease from "@/components/renderRelease";
import { clearResults } from "@/state/search";
import { Button, Heading } from "@chakra-ui/react";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { shallowEqual, useDispatch, useSelector } from "react-redux";

const SearchResults = () => {
  const dispatch = useDispatch();
  const isSearching = useSelector(state => state.search.isSearching);
  const searchQuery = useSelector(state => state.search.searchQuery);
  const searchResults = useSelector(state => state.search.searchResults, shallowEqual);
  const resultsNum = searchResults.length;
  const renderReleases = searchResults.map(release => <RenderRelease key={release._id} release={release} />);

  return (
    <>
      {searchQuery.length ? (
        <Heading as="h2">
          {resultsNum ? resultsNum : "No"} result{resultsNum === 1 ? "" : "s"} for &lsquo;
          {searchQuery}
          &rsquo;.
        </Heading>
      ) : (
        <Heading as="h2">Search for releases by artist, titles and tags.</Heading>
      )}
      <Grid mb={8}>{renderReleases}</Grid>
      {resultsNum ? (
        <Button
          alignSelf="flex-start"
          leftIcon={<FontAwesomeIcon icon={faTimes} />}
          isDisabled={isSearching}
          onClick={() => dispatch(clearResults())}
          size="sm"
        >
          Clear
        </Button>
      ) : null}
    </>
  );
};

export default SearchResults;
