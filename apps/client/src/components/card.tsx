import { Box, BoxProps, forwardRef, useColorModeValue } from "@chakra-ui/react";

const Card = forwardRef<BoxProps, "div">((props, ref) => (
  <Box
    bg={useColorModeValue("white", "gray.800")}
    borderColor={useColorModeValue("gray.200", "gray.700")}
    borderWidth="1px"
    boxShadow="md"
    marginBottom={6}
    px={[1, 4, null, 8]}
    py={8}
    ref={ref}
    rounded="md"
    {...props}
  />
));

export default Card;
