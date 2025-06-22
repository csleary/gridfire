import { Box, BoxProps, forwardRef, useColorModeValue } from "@chakra-ui/react";

const Card = forwardRef<BoxProps, "div">((props, ref) => (
  <Box
    bg={useColorModeValue("white", "gray.800")}
    borderWidth="1px"
    borderColor={useColorModeValue("gray.200", "gray.700")}
    boxShadow="md"
    px={[1, 4, null, 8]}
    py={8}
    rounded="md"
    marginBottom={6}
    ref={ref}
    {...props}
  />
));

export default Card;
