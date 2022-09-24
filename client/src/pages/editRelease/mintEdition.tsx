import {
  Box,
  Button,
  Divider,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  useColorModeValue,
  Heading
} from "@chakra-ui/react";
import { getGridFireEditionsByReleaseId, mintEdition } from "web3/contract";
import { useCallback, useEffect, useState } from "react";
import Field from "components/field";
import Icon from "components/icon";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { formatPrice } from "utils";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";
import { BigNumber, utils } from "ethers";

interface HandleChangeInterface {
  currentTarget: HTMLInputElement;
}

const colors = [
  "var(--chakra-colors-green-200)",
  "var(--chakra-colors-blue-100)",
  "var(--chakra-colors-purple-100)",
  "var(--chakra-colors-gray-400)"
];

const MintEdition = () => {
  const bgColour = useColorModeValue("white", "gray.800");
  const { activeRelease: release } = useSelector(state => state.releases, shallowEqual);
  const { _id: releaseId } = release;

  const defaultValues = {
    amount: 100,
    description: "",
    price: "20.00"
  };

  const [editions, setEditions] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({ amount: "", description: "", price: "" });

  useEffect(() => {
    const { artistName, releaseTitle } = release;
    setValues({ amount: 100, description: `${artistName} - ${releaseTitle}`, price: "20.00" });
  }, [release]);

  const fetchEditions = useCallback(async () => {
    if (releaseId) {
      const editions = await getGridFireEditionsByReleaseId(releaseId);
      setEditions(editions);
    }
  }, [releaseId]);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions]);

  const handleChange = useCallback(({ currentTarget: { name, value } }: HandleChangeInterface) => {
    const nextValue = ["price"].includes(name) ? value.replace(/[^0-9.]/g, "") : value;
    setErrors(prev => ({ ...prev, [name]: "" }));
    setValues(prev => ({ ...prev, [name]: nextValue }));
  }, []);

  const handleBlur = () => setValues(prev => ({ ...prev, price: formatPrice(prev.price) }));
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleMint = async () => {
    try {
      setIsPurchasing(true);
      const { amount, description, price } = values;
      await mintEdition({ description, price, releaseId, amount });
      handleCloseModal();
      fetchEditions();
    } catch (error) {
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <>
      <Heading size="lg" textAlign="left">
        Minted Editions
      </Heading>
      {editions.map(({ editionId, amount, balance, price }, index) => {
        const color1 = colors[index % colors.length];
        const color2 = colors[(index + 1) % colors.length];

        return (
          <Flex
            color="var(--chakra-colors-blackAlpha-700)"
            fontSize="lg"
            fontWeight="semibold"
            key={BigNumber.from(editionId).toString()}
            mb={6}
            p={4}
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
              transform="skewX(-10deg)"
            />
            <Box mr={4} zIndex={1}>
              {index + 1}.
            </Box>
            <Box mr={4} zIndex={1}>
              Qty.: {BigNumber.from(balance).toString()}/{BigNumber.from(amount).toString()}
            </Box>
            <Box mr={4} zIndex={1}>
              Price:{" "}
              <Box as="span" mr="0.2rem">
                ◈
              </Box>
              {utils.formatEther(price)}
            </Box>
          </Flex>
        );
      })}
      <Button leftIcon={<Icon icon={faEthereum} />} onClick={handleOpenModal}>
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
            <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mt={8} />
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              colorScheme={useColorModeValue("yellow", "purple")}
              leftIcon={<Icon icon={faEthereum} />}
              loadingText="Minting…"
              isDisabled={isPurchasing}
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
