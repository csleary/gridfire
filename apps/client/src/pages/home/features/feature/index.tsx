import { Box, Heading, useColorModeValue } from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import Icon from "@/components/icon";

const colors = ["var(--chakra-colors-purple-100)", "var(--chakra-colors-blue-100)", "var(--chakra-colors-green-200)"];

interface Props {
  children: React.ReactNode;
  icon: IconProp;
  title: string;
}

const Feature = ({ children, icon, title }: Props) => {
  const color = useColorModeValue("black", "purple.200");

  return (
    <Box bgColor={useColorModeValue("gray.50", "gray.900")} flex="0 0 100%" p={6}>
      <Heading
        bg={`linear-gradient(to right, ${colors.join(", ")})`}
        bgClip="text"
        color="transparent"
        fontWeight={500}
        mb={4}
        px={6}
        py={1}
        size="2xl"
      >
        <Icon color={color} icon={icon} /> {title}
      </Heading>
      <Box bg={useColorModeValue("gray.300", `linear-gradient(to right, ${colors.join(", ")})`)} height="2px" mb={3} />
      <Heading fontWeight={500} mb={0} size="xl" textAlign="left">
        {children}
      </Heading>
    </Box>
  );
};

export default Feature;
