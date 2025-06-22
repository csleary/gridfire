import { ChakraProps, IconButton } from "@chakra-ui/react";
import Icon from "components/icon";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { MouseEventHandler } from "react";

interface Props extends ChakraProps {
  ariaLabel: string;
  icon: IconDefinition;
  isDisabled?: boolean;
  onClick: MouseEventHandler;
  pulse?: boolean;
  spin?: boolean;
  title?: string;
}

const PlayerButton = ({ ariaLabel, icon, isDisabled, mr, mx, onClick, pulse, spin, title, ...rest }: Props) => {
  return (
    <IconButton
      aria-label={ariaLabel}
      color="gray.300"
      isDisabled={isDisabled}
      fontSize="2rem"
      icon={<Icon icon={icon} fixedWidth pulse={pulse} spin={spin} />}
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
