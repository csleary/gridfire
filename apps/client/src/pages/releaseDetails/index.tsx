import Card from "@/components/card";
import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { fetchRelease, setIsLoading } from "@/state/releases";
import { fetchUser } from "@/state/user";
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Link,
  Skeleton,
  SkeletonText,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue
} from "@chakra-ui/react";
import { faCalendar, faRecordVinyl } from "@fortawesome/free-solid-svg-icons";
import { DateTime } from "luxon";
import { useCallback, useEffect } from "react";
import { Helmet } from "react-helmet";
import { shallowEqual } from "react-redux";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import Actions from "./actions";
import AddToBasketButton from "./addToBasketButton";
import Artwork from "./artwork";
import Editions from "./editions";
import Price from "./price";
import PurchaseButton from "./purchaseButton";
import Tags from "./tags";
import TrackList from "./trackList/index";

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;

const ActiveRelease = () => {
  const navigate = useNavigate();
  const releaseInfoColor = useColorModeValue("gray.500", "gray.700");
  const releaseInfoText = useColorModeValue("gray.500", "gray.400");
  const dispatch = useDispatch();
  const { releaseId = "" } = useParams();
  const isLoading = useSelector(state => state.releases.isLoading);
  const purchases = useSelector(state => state.user.purchases, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
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

  const loadRelease = useCallback(async () => {
    try {
      await dispatch(fetchRelease(releaseId));
    } catch (error: any) {
      if (error.response?.status === 404) {
        return void navigate("/");
      }
      console.error("Failed to fetch release:", error);
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [dispatch, navigate, releaseId]);

  useEffect(() => {
    if (releaseId !== release._id) dispatch(setIsLoading(true));
  }, [dispatch, release._id, releaseId]);

  useEffect(() => {
    if (!releaseId) return;
    loadRelease();
  }, [loadRelease, releaseId]);

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  const handleSearch = (terms: Array<Array<string>>) => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of terms) searchParams.append(key, value);
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <>
      <Helmet>
        {releaseTitle ? <title>{isLoading ? "Loading…" : `${releaseTitle} | ${artistName}`}</title> : null}
        <meta name="description" content={`Listen to '${releaseTitle}' by ${artistName}.`} />
      </Helmet>
      <Container as="main" maxW="container.xl" p={0}>
        <Wrap spacing={4} alignItems="stretch">
          <WrapItem as="section" flex="1 1 36ch">
            <VStack alignItems="stretch" flex="1 1 32rem" spacing={4}>
              <Artwork />
              <Actions />
            </VStack>
          </WrapItem>
          <WrapItem as="section" flex="1 1 36ch" alignItems="stretch">
            <Card flex="1 1 32rem" mb={0}>
              <Skeleton isLoaded={!isLoading}>
                <Heading as="h2" size="2xl" mb={2}>
                  {releaseTitle || <>&nbsp;</>}
                </Heading>
              </Skeleton>
              <Skeleton isLoaded={!isLoading}>
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
                    transition="color var(--chakra-transition-duration-normal)"
                    mb={8}
                  >
                    {artistName || <>&nbsp;</>}
                  </Heading>
                </Link>
              </Skeleton>
              {isLoading ? (
                <Box mb={10}>
                  {Array(8)
                    .fill(null)
                    .map((_, index) => (
                      <Skeleton height={4} key={index} mb={2} />
                    ))}
                </Box>
              ) : (
                <TrackList />
              )}
              <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mb={8} />
              <Price price={price} />
              <Wrap justify="center" spacing={4} mb={6}>
                <WrapItem>
                  <PurchaseButton inCollection={isInCollection} price={price} releaseId={releaseId} />
                </WrapItem>
                <WrapItem>
                  <AddToBasketButton
                    imageUrl={`${VITE_CDN_IMG}/${releaseId}`}
                    artistName={artistName}
                    inCollection={isInCollection}
                    price={price}
                    releaseId={releaseId}
                    title={releaseTitle}
                  />
                </WrapItem>
              </Wrap>
              <Editions />
              <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mb={8} />
              <Box mb={6}>
                {isLoading ? (
                  <Skeleton height={6} mb={2} />
                ) : recordLabel ? (
                  <Flex mb={2}>
                    <Flex
                      as={Button}
                      align="center"
                      bg="purple.200"
                      height="unset"
                      justify="center"
                      minW={10}
                      mr={3}
                      onClick={handleSearch.bind(null, [["label", recordLabel]])}
                      rounded="sm"
                      variant="unstyled"
                      _hover={{ backgroundColor: "purple.300" }}
                    >
                      <Icon color={releaseInfoColor} icon={faRecordVinyl} />
                    </Flex>
                    <Box color={releaseInfoText}>{recordLabel}</Box>
                  </Flex>
                ) : null}
                {isLoading ? (
                  <Skeleton height={6} mb={2} />
                ) : (
                  releaseDate && (
                    <Flex mb={2}>
                      <Flex
                        as={Button}
                        align="center"
                        bg="blue.100"
                        height="unset"
                        justify="center"
                        minW={10}
                        mr={3}
                        onClick={handleSearch.bind(null, [["year", new Date(releaseDate).getFullYear().toString()]])}
                        rounded="sm"
                        variant="unstyled"
                        _hover={{ backgroundColor: "blue.200" }}
                      >
                        <Icon color={releaseInfoColor} icon={faCalendar} title="Release date" />
                      </Flex>
                      <Box color={releaseInfoText}>
                        {DateTime.fromISO(releaseDate).toLocaleString(DateTime.DATE_FULL)}
                      </Box>
                    </Flex>
                  )
                )}
                {isLoading ? (
                  <Skeleton height={6} mb={2} />
                ) : catNumber ? (
                  <Flex>
                    <Flex align="center" bg="green.100" justify="center" minW={10} mr={3} rounded="sm">
                      <Badge bg="none" color={releaseInfoColor}>
                        CAT.
                      </Badge>
                    </Flex>
                    <Box color={releaseInfoText}>{catNumber}</Box>
                  </Flex>
                ) : null}
              </Box>
              {isLoading ? (
                <SkeletonText mb={4} noOfLines={3} spacing={2} skeletonHeight={3} />
              ) : info ? (
                <Text mb={4} whiteSpace="pre-line">
                  {info}
                </Text>
              ) : null}
              {isLoading ? (
                <SkeletonText mb={4} noOfLines={2} spacing={2} skeletonHeight={3} />
              ) : credits ? (
                <Text mb={4} whiteSpace="pre-line">
                  {credits}
                </Text>
              ) : null}
              <Box mb={6}>
                {pubYear && (
                  <Text color="gray.400" fontSize="sm" fontWeight={500}>
                    &copy; {pubYear} {pubName}
                  </Text>
                )}
                {recYear && (
                  <Text color="gray.400" fontSize="sm" fontWeight={500}>
                    &#8471; {recYear} {recName}
                  </Text>
                )}
              </Box>
              <Tags />
            </Card>
          </WrapItem>
        </Wrap>
      </Container>
    </>
  );
};

export default ActiveRelease;
