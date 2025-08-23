import { Box, Container, Flex } from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faGlobe, faHexagonNodesBolt, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useRef, useState } from "react";

import Feature from "./feature";

const slideText = [
  {
    description: "All on Arbitrum, an Ethereum layer 2 roll-up, for fast transactions and low payment fees.",
    icon: faHexagonNodesBolt,
    id: 1,
    subtitle: "Our cut is just 5%. The rest is yours.",
    title: "Low fees"
  },
  {
    description: "Mint limited digital runs and one-offs for your releases, with exclusive downloads.",
    icon: faWandMagicSparkles,
    id: 2,
    subtitle: "Create NFT Gridfire Editions.",
    title: "NFT Editions"
  },
  {
    description: "Withdraw at any time to your wallet.",
    icon: faEthereum,
    id: 3,
    subtitle: "Payments are immediately transferred to secure artist smart contract accounts.",
    title: "Smarter payments"
  },
  {
    description: "Streamlined payments for a global audience.",
    icon: faGlobe,
    id: 4,
    subtitle: "Payments are made using the DAI stablecoin - the original USD-pegged digital currency.",
    title: "A global currency"
  }
];

const Features = () => {
  const setTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const DURATION = 8000;

  const createSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slideText.length);
    setTimeoutRef.current = setTimeout(createSlide, DURATION);
  }, []);

  useEffect(() => {
    setTimeoutRef.current = setTimeout(createSlide, DURATION);

    return () => {
      if (setTimeoutRef.current) {
        clearTimeout(setTimeoutRef.current);
      }
    };
  }, [createSlide]);

  return (
    <Container maxWidth="container.md" mb={8} overflow="hidden">
      <Flex transform={`translateX(-${currentIndex * 100}%)`} transition="transform .5s cubic-bezier(.75,.15,0,1)">
        {slideText.map(({ description, icon, id, subtitle, title }) => {
          return (
            <Feature icon={icon} key={id} title={title}>
              <Box as="span">{subtitle}</Box>{" "}
              <Box as="span" color="gray.400">
                {description}
              </Box>
            </Feature>
          );
        })}
      </Flex>
    </Container>
  );
};

export default Features;
