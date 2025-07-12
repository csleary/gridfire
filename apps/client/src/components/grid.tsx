import { Grid } from "@chakra-ui/react";
import { ReactNode } from "react";

const ReleaseGrid = ({ children, ...rest }: { children: ReactNode }) => {
  return (
    <Grid
      gap={8}
      templateColumns={[
        "repeat(auto-fill, minmax(12rem, 1fr))",
        "repeat(auto-fill, minmax(24rem, 1fr))",
        "repeat(auto-fill, minmax(28rem, 1fr))"
      ]}
      {...rest}
    >
      {children}
    </Grid>
  );
};

export default ReleaseGrid;
