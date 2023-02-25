import { IconButton } from "@chakra-ui/react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Icon from "components/icon";

interface Props {
  ariaLabel: string;
  icon: IconDefinition;
  mr?: number;
  mx?: number | number[];
  onClick: () => void;
  spin?: boolean;
  title?: string;
}

const PlayerButton = ({ ariaLabel, icon, mr, mx, onClick, spin, title }: Props) => {
  return (
    <IconButton
      aria-label={ariaLabel}
      fontSize="2rem"
      icon={<Icon icon={icon} fixedWidth spin={spin} />}
      mr={mr}
      mx={mx}
      onClick={onClick}
      title={title}
      variant="ghost"
      _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
    />
  );
};

export default PlayerButton;
