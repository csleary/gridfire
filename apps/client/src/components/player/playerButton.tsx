import Icon from "@/components/icon";
import { ChakraProps, IconButton, Spinner } from "@chakra-ui/react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { MouseEventHandler } from "react";

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
      aria-label={ariaLabel}
      color="gray.300"
      isDisabled={isDisabled || isLoading}
      fontSize="2rem"
      icon={isLoading ? <Spinner /> : <Icon icon={icon} fixedWidth />}
      mr={mr}
      mx={mx}
      onClick={onClick}
      title={title}
      variant="ghost"
      _hover={{ color: "gray.100" }}
      {...rest}
    />
  );
};

export default PlayerButton;
