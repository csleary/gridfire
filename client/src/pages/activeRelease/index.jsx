import {
  Badge,
  Box,
  Container,
  Divider,
  Flex,
  Heading,
  Link,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue
} from "@chakra-ui/react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { fetchRelease, setIsLoading } from "features/releases";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import Actions from "./actions";
import Artwork from "./artwork";
import Card from "components/card";
import { Helmet } from "react-helmet";
import Icon from "components/icon";
import PurchaseButton from "./purchaseButton";
import Tags from "./tags";
import TrackList from "./trackList";
import { faCalendar, faRecordVinyl } from "@fortawesome/free-solid-svg-icons";
import { fetchUser } from "features/user";
import moment from "moment";
import { useEffect } from "react";

const ActiveRelease = () => {
  const releaseInfoColor = useColorModeValue("gray.500", "gray.700");
  const releaseInfoText = useColorModeValue("gray.500", "gray.400");
  const dispatch = useDispatch();
  const { releaseId } = useParams();
  const { isLoading, activeRelease: release } = useSelector(state => state.releases, shallowEqual);
  const { purchases } = useSelector(state => state.user, shallowEqual);
  const isInCollection = purchases.some(sale => sale.release === releaseId);

  const {
    artist,
    artistName,
    catNumber,
    credits,
    info,
    price,
    pubName,
    pubYear,
    recName,
    recYear,
    recordLabel,
    releaseTitle,
    releaseDate
  } = release;

  useEffect(() => {
    if (releaseId !== release._id) dispatch(setIsLoading(true));
  }, [release._id, releaseId]); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchRelease(releaseId)).then(() => dispatch(setIsLoading(false)));
  }, [releaseId]); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchUser());
  }, []); // eslint-disable-line

  return (
    <>
      <Helmet>
        {releaseTitle ? <title>{isLoading ? "Loading…" : `${releaseTitle} | ${artistName}`}</title> : null}
        <meta name="description" content={`Listen to \u2018${releaseTitle}\u2019 by ${artistName}.`} />
      </Helmet>
      <Container as="main" maxW="container.xl" p={0}>
        <Wrap spacing={4}>
          <WrapItem as="section" flex="1 1 36ch">
            <VStack alignItems="stretch" flex="1 1 32rem" spacing={4}>
              <Artwork />
              <Actions />
            </VStack>
          </WrapItem>
          <WrapItem as="section" flex="1 1 36ch">
            <Card flex="1 1 32rem" mb={16}>
              <Heading as="h2" size="2xl" mb={2}>
                {releaseTitle}
              </Heading>
              <Link
                as={RouterLink}
                to={`/artist/${artist}`}
                color="gray.500"
                _hover={{ color: "initial", textDecoration: "none" }}
              >
                <Heading
                  as="h3"
                  color={useColorModeValue("gray.400", "gray.500")}
                  _hover={{ color: useColorModeValue("gray.600", "gray.400") }}
                  size="xl"
                  mb={8}
                >
                  {artistName}
                </Heading>
              </Link>
              <TrackList />
              <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mb={8} />
              <PurchaseButton inCollection={isInCollection} isLoading={isLoading} price={price} releaseId={releaseId} />
              <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mb={8} />
              {recordLabel && (
                <Flex mb={2}>
                  <Flex align="center" bg="purple.200" justify="center" minW={10} mr={3} rounded="sm">
                    <Icon color={releaseInfoColor} icon={faRecordVinyl} />
                  </Flex>
                  <Box color={releaseInfoText}>{recordLabel}</Box>
                </Flex>
              )}
              <Flex mb={2}>
                <Flex align="center" bg="blue.100" justify="center" minW={10} mr={3} rounded="sm">
                  <Icon color={releaseInfoColor} icon={faCalendar} title="Release date" />
                </Flex>
                <Box color={releaseInfoText}>{moment(new Date(releaseDate)).format("Do of MMM, YYYY")}</Box>
              </Flex>
              {catNumber && (
                <Flex mb={6}>
                  <Flex align="center" bg="green.100" justify="center" minW={10} mr={3} rounded="sm">
                    <Badge bg="none" color={releaseInfoColor}>
                      CAT.
                    </Badge>
                  </Flex>
                  <Box color={releaseInfoText}>{catNumber}</Box>
                </Flex>
              )}
              {info && (
                <Text mb={4} whiteSpace="pre-line">
                  {info}
                </Text>
              )}
              {credits && (
                <Text mb={4} whiteSpace="pre-line">
                  {credits}
                </Text>
              )}
              {pubYear && (
                <Text color="gray.400" fontSize="sm" fontWeight={500}>
                  &copy; {pubYear} {pubName}
                </Text>
              )}
              {recYear && (
                <Text color="gray.400" fontSize="sm" fontWeight={500} mb={6}>
                  &#8471; {recYear} {recName}
                </Text>
              )}
              <Tags />
            </Card>
          </WrapItem>
        </Wrap>
      </Container>
    </>
  );
};

export default ActiveRelease;
