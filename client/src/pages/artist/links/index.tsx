import { Heading, Link, VStack } from "@chakra-ui/react";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";

const Artist = () => {
  const links = useSelector(state => state.releases.artist.links, shallowEqual);

  return (
    <>
      <Heading as="h3">Links</Heading>
      <VStack as="ul" alignItems="flex-start" listStyleType="none">
        {links.map(({ title, uri }) => (
          <Link as="li" href={uri} key={uri} rel="nofollow noopener">
            {title}
          </Link>
        ))}
      </VStack>
    </>
  );
};

export default Artist;
