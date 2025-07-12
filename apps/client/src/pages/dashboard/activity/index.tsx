import { Container, Heading, List, Stack } from "@chakra-ui/react";
import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { shallowEqual } from "react-redux";

import ActivityItem from "@/components/activityItem";
import { useDispatch, useSelector } from "@/hooks";
import { fetchActivity, selectAllActivity } from "@/state/artists";

const Activity = () => {
  const dispatch = useDispatch();
  const activityList = useSelector(selectAllActivity, shallowEqual);

  useEffect(() => {
    dispatch(fetchActivity());
  }, [dispatch]);

  return (
    <>
      <Helmet>
        <title>Activity</title>
      </Helmet>
      <Container as="main" maxWidth="container.xl" p={0}>
        <Heading as="h2">Activity</Heading>
        <List>
          <Stack>
            {activityList.map(activity => (
              <ActivityItem activity={activity} key={activity._id} />
            ))}
          </Stack>
        </List>
      </Container>
    </>
  );
};

export default Activity;
