import { Box } from "@chakra-ui/react";

const Card = props => (
  <Box
    bg="white"
    borderWidth="1px"
    borderColor="gray.200"
    boxShadow="md"
    p={8}
    rounded="md"
    marginBottom={6}
    {...props}
  ></Box>
);

export default Card;
