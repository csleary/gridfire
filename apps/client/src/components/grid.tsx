import { Grid } from "@chakra-ui/react";
import { ReactNode } from "react";

const ReleaseGrid = ({ children, ...rest }: { children: ReactNode }) => {
  return (
    <Grid
      templateColumns={[
        "repeat(auto-fill, minmax(12rem, 1fr))",
        "repeat(auto-fill, minmax(24rem, 1fr))",
        "repeat(auto-fill, minmax(28rem, 1fr))"
      ]}
      gap={8}
      {...rest}
    >
      {children}
    </Grid>
  );
};

export default ReleaseGrid;
