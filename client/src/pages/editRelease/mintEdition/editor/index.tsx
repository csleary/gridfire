import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useColorModeValue
} from "@chakra-ui/react";
import { ChangeEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { MintedEdition, ReleaseTrack } from "types";
import Field from "components/field";
import Icon from "components/icon";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { formatPrice } from "utils";
import { mintEdition } from "web3/contract";
import { selectTracks } from "state/editor";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";

interface DefaultValues {
  amount: number;
  description: string;
  price: string;
  tracks: string[];
}

interface Props {
  editions: MintedEdition[];
  handleCloseModal: () => void;
  showModal: boolean;
}

const defaultValues: DefaultValues = { amount: 100, description: "", price: "50.00", tracks: [] };

const EditionEditor = ({ editions, handleCloseModal, showModal }: Props) => {
  const checkboxColour = useColorModeValue("yellow", "purple");
  const artistName = useSelector(state => state.editor.release.artistName);
  const releaseId = useSelector(state => state.editor.release._id);
  const releaseTitle = useSelector(state => state.editor.release.releaseTitle);
  const trackList = useSelector(selectTracks, shallowEqual);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({ amount: "", description: "", price: "" });
  const hasError = Object.values(errors).some(Boolean);
  const editionTrackPool = trackList.filter(({ isEditionOnly }: ReleaseTrack) => Boolean(isEditionOnly));

  const trackIdsInEditions = useMemo(
    () =>
      new Set(
        editions.flatMap(({ metadata }: MintedEdition) => metadata.properties.tracks.map(({ id }) => id), [editions])
      ),
    [editions]
  );

  useEffect(() => {
    setValues(prev => ({ ...prev, description: `${artistName} - ${releaseTitle}` }));
  }, [artistName, releaseTitle]);

  const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(e => {
    const { name, value } = e.currentTarget;
    const nextValue = ["amount", "price"].includes(name) ? value.replace(/[^0-9.]/g, "") : value;
    setErrors(prev => ({ ...prev, [name]: "" }));
    setValues(prev => ({ ...prev, [name]: nextValue }));
  }, []);

  const handleChangeTrack: ChangeEventHandler<HTMLInputElement> = e => {
    const { name: trackId, checked } = e.currentTarget;

    setValues(prev => ({
      ...prev,
      tracks: checked ? [...new Set([...prev.tracks, trackId])] : prev.tracks.filter(id => id !== trackId)
    }));
  };

  const handleBlur = () => setValues(prev => ({ ...prev, price: formatPrice(prev.price) }));

  const handleMint = async () => {
    try {
      setIsPurchasing(true);
      const { amount, description, price, tracks } = values;
      await mintEdition({ amount, description, price, releaseId, tracks });
      handleCloseModal();
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Modal isOpen={showModal} onClose={handleCloseModal} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Mint a GridFire Edition</ModalHeader>
        <ModalBody>
          <Field
            errors={errors}
            info="This will be used for the Edition NFT metadata. It might be useful to name these according to theme, depending on the exclusive tracks selected, e.g. 'Outtakes', 'Remixes', 'Live Sets', 'Superfan Pack' etc."
            label="Description"
            name="description"
            onChange={handleChange}
            size="lg"
            values={values}
            variant="modal"
          />
          <Field
            errors={errors}
            info="The total supply or amount to mint for this edition. Think how rare or unique you wish this edition to be."
            inputMode="numeric"
            label="Amount"
            name="amount"
            onChange={handleChange}
            size="lg"
            type="number"
            values={values}
            variant="modal"
          />
          <Field
            errors={errors}
            info="The price you wish to sell each edition for. As a guide, the lower the amount, the higher the price."
            inputMode="numeric"
            label="Price (DAI/USD)"
            name="price"
            onBlur={handleBlur}
            onChange={handleChange}
            size="lg"
            type="number"
            values={values}
            variant="modal"
          />
          <FormLabel color="gray.500" fontWeight={500} mb={1}>
            Select Edition-only tracks
          </FormLabel>
          {editionTrackPool.map(({ _id: trackId, trackTitle }: ReleaseTrack, index: number) => {
            return (
              <Box key={trackId}>
                <Checkbox colorScheme={checkboxColour} name={trackId} onChange={handleChangeTrack}>
                  <Box as="span" mr={2}>
                    {index + 1}.
                  </Box>
                  {trackTitle}
                  {trackIdsInEditions.has(trackId) ? null : (
                    <Badge colorScheme="blue" ml={2}>
                      Unused
                    </Badge>
                  )}
                </Checkbox>
              </Box>
            );
          })}
          <FormControl>
            <FormHelperText>
              Select optional Edition-exclusive tracks. Add more to the pool on the tracks tab. Unused tracks will still
              be hidden from normal release downloads.
            </FormHelperText>
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
  );
};

export default EditionEditor;
