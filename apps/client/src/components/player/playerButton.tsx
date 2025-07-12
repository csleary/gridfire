import { ChakraProps, IconButton, Spinner } from "@chakra-ui/react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { MouseEventHandler } from "react";

import Icon from "@/components/icon";

interface Props extends ChakraProps {
  ariaLabel: string;
  icon: IconDefinition;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick: MouseEventHandler;
  title?: string;
}

const PlayerButton = ({ ariaLabel, icon, isDisabled, isLoading, mr, mx, onClick, title, ...rest }: Props) => {
  return (
    <IconButton
      _hover={{ color: "gray.100" }}
      aria-label={ariaLabel}
      color="gray.300"
      fontSize="2rem"
      icon={isLoading ? <Spinner /> : <Icon fixedWidth icon={icon} />}
      isDisabled={isDisabled || isLoading}
      mr={mr}
      mx={mx}
      onClick={onClick}
      title={title}
      variant="ghost"
      {...rest}
    />
  );
};

export default PlayerButton;
