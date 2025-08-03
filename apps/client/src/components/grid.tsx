import { Grid } from "@chakra-ui/react";
import { ReactNode } from "react";

const ReleaseGrid = ({ children, ...rest }: { children: ReactNode }) => {
  return (
    <Grid
      gap={8}
      templateColumns={{
        "2xl": "repeat(5, 1fr)",
        base: "repeat(1, 1fr)",
        lg: "repeat(3, 1fr)",
        md: "repeat(2, 1fr)",
        sm: "repeat(1, 1fr)",
        xl: "repeat(4, 1fr)"
      }}
      {...rest}
    >
      {children}
    </Grid>
  );
};

export default ReleaseGrid;
