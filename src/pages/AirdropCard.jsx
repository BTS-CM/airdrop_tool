import React, { useState, useEffect } from 'react';
import {
  Text,
  Card,
  Button,
  Loader,
  Modal,
  JsonInput,
  Accordion,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { appStore } from '../lib/states';
import { generateDeepLink } from '../lib/generate';

export default function AirdropCard(properties) {
  const { t, i18n } = useTranslation();

  const { tokenQuantity } = properties;
  const { tokenName } = properties;
  const { distroMethod } = properties;
  const { accountID } = properties;

  const { chunk } = properties;
  const { chunkItr } = properties;
  const { winnerChunkQty } = properties;
  const { env } = properties;
  const { ticketQty } = properties;
  const { tokenDetails } = properties;
  const { quantityWinners } = properties;

  const [airdropData, setAirdropData] = useState();
  const [tx, setTX] = useState();
  const [inProgress, setInProgress] = useState(false);
  const [deepLinkItr, setDeepLinkItr] = useState(0);

  const [opened, { open, close }] = useDisclosure(false);

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[env];

  let assetName = "";
  let relevantChain = "";
  if (env === 'bitshares') {
    assetName = "BTS";
    relevantChain = 'BTS';
  } else if (env === 'bitshares_testnet') {
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
  } else if (env === 'tusc') {
    assetName = "TUSC";
    relevantChain = 'TUSC';
  }

  const currentChunkValue = distroMethod === "Proportionally"
    ? parseFloat(
      chunk
        .map((z) => ((z.qty / ticketQty) * tokenQuantity).toFixed(5))
        .reduce((accumulator, ticket) => accumulator + parseFloat(ticket), 0).toFixed(5)
    )
    : (((1 / quantityWinners) * tokenQuantity).toFixed(5)) * chunk.length;

  useEffect(() => {
    async function fetchData() {
      setInProgress(true);

      const ops = chunk.map((x) => ({
        fee: {
          amount: 0,
          asset_id: tokenDetails.id,
        },
        from: accountID,
        to: x.id,
        amount: {
          amount: parseFloat(
            distroMethod === "Proportionally"
              ? ((x.qty / ticketQty) * tokenQuantity).toFixed(tokenDetails.precision)
              : (((1 / quantityWinners) * tokenQuantity).toFixed(tokenDetails.precision)),
          ) * 100000,
          asset_id: tokenDetails.id,
        },
      }));

      setTX(ops);

      let payload;
      try {
        payload = await generateDeepLink(
          'airdrop',
          relevantChain,
          currentNodes[0],
          'transfer',
          ops
        );
      } catch (error) {
        console.log(error);
        return;
      }

      if (payload && payload.length) {
        setAirdropData(payload);
      }

      setInProgress(false);
    }

    if (deepLinkItr && deepLinkItr > 0) {
      fetchData();
    }
  }, [deepLinkItr]);

  return (
    <Card key={`airdrop_${chunkItr}`} mt="md" shadow="md" radius="md" padding="xl">
      <Text>
        {t("airdropCard:airdrop")} #
        {chunkItr + 1}
        /
        {winnerChunkQty}
      </Text>
      <Text fz="sm" c="dimmed">
        {`${chunk.length} ${t("airdropCard:accounts")} ${chunk.length > 1 ? `(${t("airdropCard:from")} ${chunk[0].id} ${t("airdropCard:to")} ${chunk[chunk.length - 1].id})` : null}`}
        <br />
        { `${currentChunkValue} ${tokenName || assetName} ${t("airdropCard:distro")}` }
      </Text>
      <Modal
        opened={opened}
        onClose={() => {
          setAirdropData();
          close();
          setTX();
        }}
        title={`${t("airdropCard:airdrop")} #${chunkItr + 1}/${winnerChunkQty}`}
      >
        {
          !airdropData && !inProgress
            ? (
              <>
                <Text>{t("airdropCard:method")}</Text>
                <Text m="sm" fz="xs">
                  {t("airdropCard:preStep1")}
                  <br />
                  {t("airdropCard:preStep2")}
                  <br />
                  {t("airdropCard:preStep3")}
                </Text>
                <Button
                  mt="md"
                  onClick={() => setDeepLinkItr(deepLinkItr + 1)}
                >
                  {t("airdropCard:generate")}
                </Button>
              </>
            )
            : null
        }
        {
          inProgress
            ? <Loader size="xs" variant="dots" />
            : null
        }
        {
          airdropData
            ? (
              <>
                <Text>{t("airdropCard:confirmation")}</Text>
                <Text fz="xs">
                  {t("airdropCard:download1")}
                  <br />
                  {t("airdropCard:download2")}
                  <br />
                  {t("airdropCard:download3")}
                </Text>

                <a
                  href={`data:text/json;charset=utf-8,${airdropData}`}
                  download={`airdrop_${chunkItr + 1}.json`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button mt="md">
                    {t("airdropCard:downloadButton")}
                  </Button>
                </a>

                <Accordion mt="xs">
                  <Accordion.Item key="json" value="operation_json">
                    <Accordion.Control>
                      {t("airdropCard:viewJSON")}
                    </Accordion.Control>
                    <Accordion.Panel style={{ backgroundColor: '#FAFAFA' }}>
                      <JsonInput
                        placeholder="Textarea will autosize to fit the content"
                        defaultValue={JSON.stringify(tx)}
                        validationError="Invalid JSON"
                        formatOnBlur
                        autosize
                        minRows={4}
                        maxRows={15}
                      />
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </>
            )
            : null
        }
      </Modal>
      {
        accountID.length > 5
          ? <Button mt="md" onClick={open}>{t("airdropCard:begin")}</Button>
          : <Button mt="md" disabled>{t("airdropCard:begin")}</Button>
      }
    </Card>
  );
}
