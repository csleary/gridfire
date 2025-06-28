import { useSelector } from "@/hooks";
import { Box, Heading } from "@chakra-ui/react";
import { lazy } from "react";
import { shallowEqual } from "react-redux";
const Albums = lazy(() => import("./albums"));
const Editions = lazy(() => import("./editions"));
const Singles = lazy(() => import("./singles"));

const Collection = () => {
  const albums = useSelector(state => state.releases.userAlbums, shallowEqual);
  const singles = useSelector(state => state.releases.userSingles, shallowEqual);
  const userEditions = useSelector(state => state.releases.userEditions, shallowEqual);
  const available = [...albums, ...singles, ...userEditions].filter(({ release }) => Boolean(release));

  return (
    <Box as={"main"} flexGrow={1}>
      <Heading as="h3">
        Your Collection ({available.length} release{available.length === 1 ? "" : "s"})
      </Heading>
      <Editions />
      <Albums />
      <Singles />
    </Box>
  );
};

export default Collection;
