import { Box, Divider, Heading, useColorModeValue, WrapItem } from "@chakra-ui/react";

const Feature = ({ children, title }) => {
  const color = useColorModeValue("black", "purple.200");

  return (
    <WrapItem
      alignItems="center"
      bgColor={useColorModeValue("gray.50", "gray.900")}
      flex="0 1 40ch"
      flexDirection="column"
      padding={8}
      transform="skewX(-10deg)"
    >
      <Box transform="skewX(10deg)">
        <Heading color={color} paddingInlineEnd={6} paddingInlineStart={6} py={1} size="lg" mb={4}>
          {title}
        </Heading>
        <Divider borderColor={useColorModeValue("gray.300", "purple.200")} borderWidth="2px" mb={3} />
        <Heading textAlign="left" size="md" mb={0}>
          {children}
        </Heading>
      </Box>
    </WrapItem>
  );
};

export default Feature;
