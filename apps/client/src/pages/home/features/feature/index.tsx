import { Box, Divider, Heading, useColorModeValue, WrapItem } from "@chakra-ui/react";

interface Props {
  children: React.ReactNode;
  title: string;
}

const Feature = ({ children, title }: Props) => {
  const color = useColorModeValue("black", "purple.200");

  return (
    <WrapItem alignItems="center" flex="0 1 50ch" flexDirection="column" padding={12} position="relative">
      <Box bgColor={useColorModeValue("gray.50", "gray.900")} inset={0} position="absolute" transform="skewX(-10deg)" />
      <Box zIndex="1">
        <Heading color={color} fontWeight={500} mb={4} paddingInlineEnd={6} paddingInlineStart={6} py={1} size="lg">
          {title}
        </Heading>
        <Divider borderColor={useColorModeValue("gray.300", "purple.200")} borderWidth="2px 0" mb={3} />
        <Heading fontWeight={500} mb={0} size="md" textAlign="left">
          {children}
        </Heading>
      </Box>
    </WrapItem>
  );
};

export default Feature;
