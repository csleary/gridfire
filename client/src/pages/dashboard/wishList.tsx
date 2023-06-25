import { Box, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { useDispatch, useSelector } from "hooks";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import Grid from "components/grid";
import Icon from "components/icon";
import RenderRelease from "components/renderRelease";
import { fetchUserWishList } from "state/releases";
import { faStickyNote as faStickyNoteOutline } from "@fortawesome/free-regular-svg-icons";
import { faStickyNote } from "@fortawesome/free-solid-svg-icons";
import { shallowEqual } from "react-redux";

const WishList = () => {
  const dispatch = useDispatch();
  const { userWishList } = useSelector(state => state.releases, shallowEqual);
  const [isLoading, setLoading] = useState(false);
  const noteIcon = useColorModeValue(faStickyNoteOutline, faStickyNote);
  const noteTextColour = useColorModeValue("gray.600", "gray.300");
  const noteColour = useColorModeValue("yellow.500", "yellow.100");

  useEffect(() => {
    if (!userWishList.length) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchUserWishList()).then(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <Box as={"main"} flexGrow={1}>
      <Heading as="h3">Wish List</Heading>
      <Grid>
        {userWishList.map(withlisted => (
          <Box key={withlisted._id}>
            <RenderRelease release={withlisted.release} />
            <Box mt={2}>
              <Text>
                <Icon verticalAlign="middle" color={noteColour} icon={noteIcon} mr={2} />
                {withlisted.note}
              </Text>
              <Text color={noteTextColour}>&ndash; {DateTime.fromISO(withlisted.dateAdded).toFormat("ff")}.</Text>
            </Box>
          </Box>
        ))}
      </Grid>
    </Box>
  );
};

export default WishList;
