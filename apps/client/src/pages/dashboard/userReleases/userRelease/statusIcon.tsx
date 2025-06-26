import Icon from "@/components/icon";
import { Square, useColorModeValue } from "@chakra-ui/react";
import { faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  published: boolean;
  releaseTitle: string;
}

const StatusIcon = ({ published, releaseTitle }: Props) => {
  const publishedColor = useColorModeValue("green.400", "green.200");

  return (
    <Square bg={useColorModeValue("white", "gray.700")} rounded="full" position="absolute" size={10} right={6} top={6}>
      <Icon
        fontSize="2rem"
        color={published ? publishedColor : "orange.300"}
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
