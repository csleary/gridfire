import { Square, useColorModeValue } from "@chakra-ui/react";
import { faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

import Icon from "@/components/icon";

interface Props {
  published: boolean;
  releaseTitle: string;
}

const StatusIcon = ({ published, releaseTitle }: Props) => {
  const publishedColor = useColorModeValue("green.400", "green.200");

  return (
    <Square bg={useColorModeValue("white", "gray.700")} position="absolute" right={6} rounded="full" size={10} top={6}>
      <Icon
        color={published ? publishedColor : "orange.300"}
        fontSize="2rem"
        icon={published ? faCheckCircle : faExclamationCircle}
        title={
          published
            ? `'${releaseTitle}' is live and available for purchase.`
            : `'${releaseTitle}' is currently offline.`
        }
      />
    </Square>
  );
};

export default StatusIcon;
