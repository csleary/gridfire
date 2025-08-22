import { Box, BoxProps, forwardRef, useColorModeValue } from "@chakra-ui/react";

const Card = forwardRef<BoxProps, "div">((props, ref) => (
  <Box
    bg={useColorModeValue("white", "gray.800")}
    borderBottomWidth="1px"
    borderColor={useColorModeValue("gray.200", "gray.700")}
    borderLeftWidth={{ base: 0, md: "1px" }}
    borderRightWidth={{ base: 0, md: "1px" }}
    borderTopWidth="1px"
    boxShadow="md"
    marginBottom={6}
    px={{ base: 4, xl: 8 }}
    py={8}
    ref={ref}
    rounded={{ base: 0, md: "md" }}
    {...props}
  />
));

export default Card;
