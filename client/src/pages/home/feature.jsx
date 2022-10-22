import { Box, Divider, Heading, useColorModeValue, WrapItem } from "@chakra-ui/react";

const Feature = ({ children, title }) => {
  const color = useColorModeValue("black", "purple.200");

  return (
    <WrapItem alignItems="center" flex="0 1 50ch" flexDirection="column" padding={12} position="relative">
      <Box bgColor={useColorModeValue("gray.50", "gray.900")} position="absolute" inset={0} transform="skewX(-10deg)" />
      <Box zIndex="1">
        <Heading color={color} fontWeight={500} paddingInlineEnd={6} paddingInlineStart={6} py={1} size="lg" mb={4}>
          {title}
        </Heading>
        <Divider borderColor={useColorModeValue("gray.300", "purple.200")} borderWidth="2px 0" mb={3} />
        <Heading fontWeight={500} textAlign="left" size="md" mb={0}>
          {children}
        </Heading>
      </Box>
    </WrapItem>
  );
};

export default Feature;
