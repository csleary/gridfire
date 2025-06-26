import Icon from "@/components/icon";
import { useSelector } from "@/hooks";
import { MintedEdition } from "@/types";
import { fetchGridfireEditionUris, fetchMintedGridfireEditionsByReleaseId } from "@/web3";
import { Button, Heading, Text } from "@chakra-ui/react";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { shallowEqual } from "react-redux";
import { useParams } from "react-router-dom";
import EditionEditor from "./editor";
import MintedEditions from "./mintedEditions";

const MintEdition = () => {
  const { releaseId: releaseIdParam } = useParams();
  const isEditing = typeof releaseIdParam !== "undefined";
  const mintedEditionIds = useSelector(state => state.web3.mintedEditionIds, shallowEqual);
  const [editions, setEditions] = useState<MintedEdition[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchEditions = useCallback(async () => {
    if (releaseIdParam) {
      const [editions, uris] = await Promise.all([
        fetchMintedGridfireEditionsByReleaseId(releaseIdParam),
        fetchGridfireEditionUris(releaseIdParam)
      ]);

      editions.forEach((edition: MintedEdition, index: number) => (edition.uri = uris[index]));
      setEditions(editions);
    }
  }, [releaseIdParam]);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions, mintedEditionIds.length]);

  const handleChangeVisibility = async (editionId: string, visibility: "hidden" | "visible") => {
    try {
      setEditions(prev =>
        prev.map(edition => {
          if (edition.editionId.toString() === editionId) {
            return { ...edition, visibility };
          }
          return edition;
        })
      );
      await axios.patch(`/api/editions/${editionId}/visibility`, { visibility });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseModal = () => setShowModal(false);
  const handleOpenModal = () => setShowModal(true);

  return (
    <>
      <Heading size="lg" textAlign="left">
        Editions
      </Heading>
      <Text mb={6}>
        Mint a limited run of NFT-backed Gridfire Editions for your release, with exclusive tracks. These will be listed
        on the release page, below the standard audio-only release.
      </Text>
      <Heading size="lg" textAlign="left">
        Minted Editions
      </Heading>
      <MintedEditions editions={editions} handleChangeVisibility={handleChangeVisibility} />
      <Button isDisabled={!isEditing} leftIcon={<Icon icon={faPlusCircle} />} onClick={handleOpenModal}>
        Mint Gridfire Edition
      </Button>
      <EditionEditor editions={editions} handleCloseModal={handleCloseModal} showModal={showModal} />
    </>
  );
};

export default MintEdition;
