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
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { MintedEdition, ReleaseTrack } from "@gridfire/shared/types";
import { ChangeEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual } from "react-redux";

import Field from "@/components/field";
import Icon from "@/components/icon";
import { useSelector } from "@/hooks";
import { selectTracks } from "@/state/editor";
import { formatPrice } from "@/utils";
import { mintEdition } from "@/web3";

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
  const [isPurchasing, setIsMinting] = useState(false);
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
    const { checked, name: trackId } = e.currentTarget;

    setValues(prev => ({
      ...prev,
      tracks: checked ? [...new Set([trackId, ...prev.tracks])] : prev.tracks.filter(id => id !== trackId)
    }));
  };

  const handleBlur = () => setValues(prev => ({ ...prev, price: formatPrice(prev.price) }));

  const handleClose = () => {
    handleCloseModal();
    resetValues();
  };

  const validate = () => {
    const { amount, description, price } = values;
    const errors = { amount: "", description: "", price: "" };

    if (!description) {
      errors.description = "Please enter a description for this Edition.";
    }

    if (!amount) {
      errors.amount = "Please enter the amount of Editions you wish to create.";
    } else if (Number(amount) < 1) {
      errors.amount = "Please enter an amount of at least 1.";
    }

    if (Number(price) < 0.01) {
      errors.price = "Please enter a valid price for this Edition.";
    }

    return errors;
  };

  const handleMint = async () => {
    try {
      setIsMinting(true);
      const errors = validate();

      if (Object.values(errors).some(Boolean)) {
        setErrors(errors);
        return;
      }

      const { amount, description, price, tracks } = values;
      await mintEdition({ amount, description, price, releaseId, tracks });
      handleClose();
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsMinting(false);
    }
  };

  const resetValues = () => {
    setValues(defaultValues);
    setErrors({ amount: "", description: "", price: "" });
  };

  return (
    <Modal isCentered isOpen={showModal} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Mint a Gridfire Edition</ModalHeader>
        <ModalBody>
          <Field
            error={errors.description}
            info="This will also be used for the Edition NFT metadata. e.g. 'Outtakes', 'Remixes', 'Live Sets', 'Superfan Pack' etc."
            label="Description"
            name="description"
            onChange={handleChange}
            size="lg"
            values={values}
            variant="modal"
          />
          <Field
            error={errors.amount}
            info="The total supply or amount to mint for this edition. Think how rare or unique you wish this edition to be."
            inputMode="numeric"
            label="Amount"
            min={1}
            name="amount"
            onChange={handleChange}
            size="lg"
            type="number"
            values={values}
            variant="modal"
          />
          <Field
            error={errors.price}
            info="The price you wish to sell each edition for. As a guide, the lower the amount (and more rare the Edition), the higher the price."
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
                <Checkbox
                  colorScheme={checkboxColour}
                  isChecked={values.tracks.includes(trackId)}
                  name={trackId}
                  onChange={handleChangeTrack}
                >
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
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            colorScheme={useColorModeValue("yellow", "purple")}
            isDisabled={hasError || isPurchasing}
            isLoading={isPurchasing}
            leftIcon={<Icon icon={faEthereum} />}
            loadingText="Minting…"
            ml="auto"
            onClick={handleMint}
          >
            Mint Gridfire Edition
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditionEditor;
