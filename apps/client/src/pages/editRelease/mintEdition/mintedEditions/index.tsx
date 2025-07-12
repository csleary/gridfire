import { Box, Flex, FormLabel, Link, Stack, StackDivider, Switch, Text } from "@chakra-ui/react";
import { faFileAudio } from "@fortawesome/free-regular-svg-icons";
import { faInfo } from "@fortawesome/free-solid-svg-icons";
import { MintedEdition } from "@gridfire/shared/types";
import { formatEther } from "ethers";
import { useParams } from "react-router-dom";

import Icon from "@/components/icon";
import ScaleFade from "@/components/transitions/scaleFade";

const VITE_IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY;

const colors = [
  "var(--chakra-colors-green-200)",
  "var(--chakra-colors-blue-100)",
  "var(--chakra-colors-purple-100)",
  "var(--chakra-colors-gray-400)"
];

interface Props {
  editions: MintedEdition[];
  handleChangeVisibility: (editionId: string, visibility: "hidden" | "visible") => void;
}

const MintedEditions = ({ editions, handleChangeVisibility }: Props) => {
  const { releaseId: releaseIdParam } = useParams();
  const isEditing = typeof releaseIdParam !== "undefined";

  if (editions.length) {
    return editions.map(
      ({ amount, balance, editionId, metadata, price, uri = "", visibility }: MintedEdition, index: number) => {
        const { description, properties } = metadata;
        const { tracks } = properties;
        const color1 = colors[index % colors.length];
        const color2 = colors[(index + 1) % colors.length];
        const shortUri = `${uri.slice(0, 13)}…${uri.slice(-6)}`;

        return (
          <ScaleFade key={editionId.toString()}>
            <Stack
              background={`linear-gradient(to right, ${color1}, ${color2})`}
              color="blackAlpha.700"
              direction={["column", "column", "row"]}
              divider={<StackDivider borderColor="blackAlpha.300" />}
              fontSize="lg"
              fontWeight="semibold"
              mb={8}
              padding={4}
              position="relative"
              rounded="lg"
              spacing={4}
            >
              <Box>
                <Box>
                  {BigInt(balance).toString()}/{BigInt(amount).toString()}
                </Box>
                <Box>
                  <Box as="span" mr="0.2rem">
                    ◈
                  </Box>
                  {Number(formatEther(price)).toFixed(2)}
                </Box>
                <Box fontFamily="monospace">
                  <Link href={`${VITE_IPFS_GATEWAY}/${uri.slice(7)}`} isExternal>
                    {shortUri}
                  </Link>
                </Box>
              </Box>
              <Box flex={[null, "0 1 40ch"]}>
                <Box color="blackAlpha.600">
                  <Icon icon={faInfo} mr={2} />
                  Info
                </Box>
                <Box>{description}</Box>
              </Box>
              <Box>
                <Box color="blackAlpha.600">
                  <Icon icon={faFileAudio} mr={2} />
                  Exclusives
                </Box>
                {tracks.map(({ id, title }, trackIndex) => (
                  <Box key={id}>
                    {trackIndex + 1}. {title}
                  </Box>
                ))}
              </Box>
              <Box ml="auto">
                <Stack spacing={4}>
                  <Flex alignItems="center">
                    <FormLabel htmlFor={`${editionId}-visibility`} m={0} mr={2}>
                      Visible
                    </FormLabel>
                    <Switch
                      colorScheme="blackAlpha"
                      isChecked={visibility === "visible"}
                      onChange={e =>
                        handleChangeVisibility(editionId.toString(), e.target.checked ? "visible" : "hidden")
                      }
                      title="Toggle Edition visibility for the release page."
                      value={visibility}
                    />
                  </Flex>
                </Stack>
              </Box>
            </Stack>
          </ScaleFade>
        );
      }
    );
  }

  return (
    <Text mb={8}>
      {!isEditing
        ? "Please save the release first before minting editions."
        : "You haven't minted any editions for this release. Use the button below to get started!"}
    </Text>
  );
};

export default MintedEditions;
