import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormLabel,
  FormHelperText,
  Heading,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
  useColorModeValue,
  FormControl
} from "@chakra-ui/react";
import { BigNumber, utils } from "ethers";
import { GridFireEdition, MintedGridFireEdition } from "types";
import { getGridFireEditionsByReleaseId, getGridFireEditionUris, mintEdition } from "web3/contract";
import { useCallback, useEffect, useState } from "react";
import { CLOUD_URL } from "index";
import Field from "components/field";
import Icon from "components/icon";
import ScaleFade from "components/transitions/scaleFade";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "utils";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";
import { useParams } from "react-router-dom";

interface HandleChangeInterface {
  currentTarget: HTMLInputElement;
}

interface ValuesInterface {
  amount: Number;
  description: String;
  price: String;
  tracks: String[];
}

const colors = [
  "var(--chakra-colors-green-200)",
  "var(--chakra-colors-blue-100)",
  "var(--chakra-colors-purple-100)",
  "var(--chakra-colors-gray-400)"
];

const Label = ({ children }: { children: any }) => (
  <Box as="span" fontWeight="400" mr={2}>
    {children}
  </Box>
);

const defaultValues: ValuesInterface = { amount: 100, description: "", price: "50.00", tracks: [] };

const MintEdition = () => {
  const { releaseId: releaseIdParam } = useParams();
  const isEditing = typeof releaseIdParam !== "undefined";
  const bgColour = useColorModeValue("white", "gray.800");
  const checkboxColour = useColorModeValue("yellow", "purple");
  const { activeRelease: release } = useSelector(state => state.releases, shallowEqual);
  const { mintedEditionIds } = useSelector(state => state.web3, shallowEqual);
  const { _id: releaseId, trackList } = release;
  const [editions, setEditions] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({ amount: "", description: "", price: "" });
  const hasError = Object.values(errors).some(Boolean);
  const editionTrackPool = trackList.filter(({ isEditionOnly }) => Boolean(isEditionOnly));

  useEffect(() => {
    const { artistName, releaseTitle } = release;
    setValues(prev => ({ ...prev, description: `${artistName} - ${releaseTitle}` }));
  }, [release]);

  const fetchEditions = useCallback(async () => {
    if (releaseIdParam) {
      const [editions, uris] = await Promise.all([
        getGridFireEditionsByReleaseId(releaseIdParam),
        getGridFireEditionUris(releaseIdParam)
      ]);

      editions.forEach((edition: GridFireEdition, index: number) => (edition.uri = uris[index]));
      setEditions(editions);
    }
  }, [releaseIdParam]);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions, mintedEditionIds]);

  const handleChange = useCallback(({ currentTarget: { name, value } }: HandleChangeInterface) => {
    const nextValue = ["price"].includes(name) ? value.replace(/[^0-9.]/g, "") : value;
    setErrors(prev => ({ ...prev, [name]: "" }));
    setValues(prev => ({ ...prev, [name]: nextValue }));
  }, []);

  const handleChangeTrack = (e: HandleChangeInterface) => {
    const { name: trackId, checked } = e.currentTarget;

    setValues(prev => ({
      ...prev,
      tracks: checked ? [...new Set([...prev.tracks, trackId])] : prev.tracks.filter(id => id !== trackId)
    }));
  };

  const handleBlur = () => setValues(prev => ({ ...prev, price: formatPrice(prev.price) }));
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleMint = async () => {
    try {
      setIsPurchasing(true);
      const { amount, description, price, tracks } = values;
      await mintEdition({ amount, description, price, releaseId, tracks });
      handleCloseModal();
    } catch (error) {
      console.log(error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <>
      <Heading size="lg" textAlign="left">
        Editions
      </Heading>
      <Text mb={6}>
        Mint a limited run of NFT-backed GridFire Editions for your release. These will be listed on the release page,
        below the standard audio-only release.
      </Text>
      <Heading size="lg" textAlign="left">
        Minted Editions
      </Heading>
      {editions.length ? (
        editions.map(({ amount, balance, editionId, metadata, price, uri = "" }: MintedGridFireEdition, index) => {
          const { description, properties } = metadata;
          const { tracks } = properties;
          const color1 = colors[index % colors.length];
          const color2 = colors[(index + 1) % colors.length];
          const shortUri = `${uri.slice(0, 13)}…${uri.slice(-6)}`;

          return (
            <ScaleFade key={BigNumber.from(editionId).toString()}>
              <Flex
                color="var(--chakra-colors-blackAlpha-700)"
                flexDirection="column"
                fontSize="lg"
                fontWeight="semibold"
                mb={8}
                mx={12}
                px={8}
                py={6}
                position="relative"
              >
                <Box
                  background={`linear-gradient(to right, ${color1}, ${color2})`}
                  position="absolute"
                  top={0}
                  right={0}
                  bottom={0}
                  left={0}
                  rounded="lg"
                />
                <Box fontWeight="500" zIndex={1}>
                  <Box>
                    <Label>Current balance/total run:</Label>
                    {BigNumber.from(balance).toString()}/{BigNumber.from(amount).toString()}
                  </Box>
                  <Box>
                    <Label>Price in DAI:</Label>
                    <Box as="span" mr="0.2rem">
                      ◈
                    </Box>
                    {Number(utils.formatEther(price)).toFixed(2)}
                  </Box>
                  <Box>
                    <Label>Metadata URI:</Label>
                    <Link href={`${CLOUD_URL}/${uri.slice(7)}`} isExternal>
                      {shortUri}
                    </Link>
                  </Box>
                  <Box>
                    <Label>Description:</Label>
                    <Text>{description}</Text>
                  </Box>
                  <Box mt={2}>
                    <Label>Exclusive tracks:</Label>
                  </Box>
                  {tracks.map(({ id, title }, trackIndex) => (
                    <Box mx={3} zIndex={1} key={id}>
                      {trackIndex + 1}. {title}
                    </Box>
                  ))}
                </Box>
              </Flex>
            </ScaleFade>
          );
        })
      ) : (
        <Text mb={8}>You haven't minted any editions for this release. Use the button below to get started!</Text>
      )}
      <Button isDisabled={!isEditing} leftIcon={<Icon icon={faPlusCircle} />} onClick={handleOpenModal}>
        Mint GridFire Edition
      </Button>
      <Modal isOpen={showModal} onClose={handleCloseModal} size="md" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Mint a GridFire Edition</ModalHeader>
          <ModalBody>
            <Field
              backgroundColor={bgColour}
              errors={errors}
              info="This will be used for the edition NFT metadata, set to the artist and release title by default."
              label="Description"
              name="description"
              onChange={handleChange}
              size="lg"
              values={values}
            />
            <Field
              backgroundColor={bgColour}
              errors={errors}
              info="The total supply amount for this edition."
              inputMode="numeric"
              label="Amount"
              name="amount"
              onChange={handleChange}
              size="lg"
              type="number"
              values={values}
            />
            <Field
              backgroundColor={bgColour}
              errors={errors}
              info="The price you wish to sell each edition for."
              label="Price (DAI/USD)"
              name="price"
              onBlur={handleBlur}
              onChange={handleChange}
              size="lg"
              values={values}
            />
            <FormLabel color="gray.500" fontWeight={500} mb={1}>
              Select Edition-only tracks
            </FormLabel>
            {editionTrackPool.map(({ _id: trackId, trackTitle }, index) => {
              return (
                <Box key={trackId}>
                  <Checkbox colorScheme={checkboxColour} name={trackId} onChange={handleChangeTrack}>
                    <Box as="span" mr={2}>
                      {index + 1}.
                    </Box>
                    {trackTitle}
                  </Checkbox>
                </Box>
              );
            })}
            <FormControl>
              <FormHelperText>Select optional Edition-exclusive tracks</FormHelperText>
            </FormControl>
            <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mt={8} />
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              colorScheme={useColorModeValue("yellow", "purple")}
              leftIcon={<Icon icon={faEthereum} />}
              loadingText="Minting…"
              isDisabled={hasError || isPurchasing}
              isLoading={isPurchasing}
              onClick={handleMint}
              ml="auto"
            >
              Mint GridFire Edition
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MintEdition;
