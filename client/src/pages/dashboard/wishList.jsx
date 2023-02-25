import { Box, Heading, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Grid from "components/grid";
import Icon from "components/icon";
import RenderRelease from "components/renderRelease";
import { fetchUserWishList } from "state/releases";
import { faStickyNote as faStickyNoteOutline } from "@fortawesome/free-regular-svg-icons";
import { faStickyNote } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";

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
          <VStack key={withlisted._id}>
            <RenderRelease release={withlisted.release} />
            <Box>
              <Icon color={noteColour} icon={noteIcon} mr={2} />
              {withlisted.note}
              <Text color={noteTextColour}>
                &ndash; {moment(new Date(withlisted.dateAdded)).format("Do of MMM, YYYY")}.
              </Text>
            </Box>
          </VStack>
        ))}
      </Grid>
    </Box>
  );
};

export default WishList;
