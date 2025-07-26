import { Box, Container, Heading } from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";

import Grid from "@/components/grid";
import RenderRelease from "@/components/renderRelease";
import SearchInput from "@/components/searchInput";

const SearchResults = () => {
  const searchQuery = useSelector(state => state.search.searchQuery);
  const searchResults = useSelector(state => state.search.searchResults, shallowEqual);
  const resultsNum = searchResults.length;
  const renderReleases = searchResults.map(release => <RenderRelease key={release._id} release={release} />);

  return (
    <>
      <Container mb={12}>
        <Heading mb={12}>Search</Heading>
        <SearchInput mb={4} />
        {searchQuery.length ? (
          <Box>
            {resultsNum ? resultsNum : "No"} result{resultsNum === 1 ? "" : "s"} for &lsquo;
            {searchQuery}
            &rsquo;
          </Box>
        ) : (
          <Box>Search for releases by artist, labels, titles and tags.</Box>
        )}
      </Container>
      <Grid mb={8}>{renderReleases}</Grid>
    </>
  );
};

export default SearchResults;
