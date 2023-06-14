import React, { useState, useEffect } from 'react';
import {
  Text,
  Card,
  Button,
  Loader,
  Modal,
  JsonInput,
  Group,
  Center,
  Radio,
  Accordion,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { appStore, beetStore, tempStore } from '../lib/states';
import { generateDeepLink, beetBroadcast } from '../lib/generate';
import GetAccount from './GetAccount';

export default function modal(properties) {
  const { t, i18n } = useTranslation();

  const { tokenQuantity } = properties;
  const { tokenName } = properties;
  const { distroMethod } = properties;

  const { chunk } = properties;
  const { chunkItr } = properties;
  const { winnerChunkQty } = properties;
  const { env } = properties;
  const { ticketQty } = properties;
  const { tokenDetails } = properties;
  const { quantityWinners } = properties;

  // for beet use
  const connection = beetStore((state) => state.connection);
  const isLinked = beetStore((state) => state.isLinked);
  const identity = beetStore((state) => state.identity);
  const reset = beetStore((state) => state.reset);

  const account = tempStore((state) => state.account);

  const [airdropData, setAirdropData] = useState();
  const [tx, setTX] = useState();
  const [inProgress, setInProgress] = useState(false);
  const [deepLinkItr, setDeepLinkItr] = useState(0);

  const [outcome, setOutcome] = useState();
  const [method, setMethod] = useState();
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

  const ops = chunk.map((x) => ({
    fee: {
      amount: 0,
      asset_id: tokenDetails.id,
    },
    from: account,
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

  async function broadcast() {
    setInProgress(true);
    setOutcome();
    let response;
    try {
      response = await beetBroadcast(
        connection,
        relevantChain,
        currentNodes[0],
        'transfer',
        ops
      );
    } catch (error) {
      console.log(error);
      setInProgress(false);
      setOutcome("FAILURE");
      return;
    }

    setOutcome("SUCCESS");
    setInProgress(false);
  }

  useEffect(() => {
    async function fetchData() {
      setInProgress(true);

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

  let modalContents = null;
  if (inProgress) {
    modalContents = <Loader size="xs" variant="dots" />;
  } else if (!method) {
    // Let user choose how to proceed
    modalContents = (
      <>
        <Text>How do you want to proceed?</Text>
        <Group mt="sm">
          <Button compact onClick={() => setMethod("BEET")}>BEET</Button>
          <Button compact onClick={() => setMethod("DEEPLINK")}>Deeplink</Button>
          <Button compact onClick={() => setMethod("LOCAL")}>Local file</Button>
          <Button compact onClick={() => setMethod("JSON")}>View JSON</Button>
        </Group>
      </>
    );
  } else if (outcome) {
    if (outcome === "SUCCESS") {
      modalContents = (
        <>
          <Text>Successfully broadcast to the blockchain!</Text>
          <Button onClick={() => {
            setAirdropData();
            close();
            setTX();
            setMethod();
            setInProgress();
            reset();
          }}>
            Close
          </Button>
        </>
      )
    } else if (outcome === "FAILURE") {
      modalContents = (
        <>
          <Text>Prompt failed to broadcast to blockchain.</Text>
          <Button
            onClick={() => {
              setOutcome();
              reset();
            }}
          >
            Try again
          </Button>
        </>
      )
    }
  } else if (method === "BEET") {
    // Broadcast via BEET
    if (!identity) {
      modalContents = (
        <>
          <GetAccount beetOnly />
        </>
      );
    }
    if (connection && identity) {
      modalContents = (
        <>
          <Text>Ready to broadcast airdrop to BEET wallet</Text>
          <Text>{identity.chain}</Text>
          <Button mt="sm" onClick={async () => await broadcast()}>
            {t("modal:deeplink.DL.beetBTN")}
          </Button>
        </>
      );
    }
  } else if (method === "DEEPLINK") {
    // Construct deeplink
    if (!airdropData && !inProgress) {
      modalContents = (
        <>
          <Text>{t("airdropCard:deeplink.noDL.title")}</Text>
          <Text m="sm" fz="xs">
            {t("modal:deeplink.noDL.step1")}
            <br />
            {t("modal:deeplink.noDL.step2", { opNum: 0, opName: "Transfer" })}
            <br />
            {t("modal:deeplink.noDL.step3")}
          </Text>
          <Button
            mt="md"
            onClick={() => setDeepLinkItr(deepLinkItr + 1)}
          >
            {t("modal:deeplink.noDL.btn")}
          </Button>
        </>
      );
    } else if (airdropData) {
      modalContents = (
        <>
          <Text>{t("modal:deeplink.DL.title")}</Text>
          <Text fz="xs">
            {t("modal:deeplink.DL.step1")}
            <br />
            {t("modal:deeplink.DL.step2")}
            <br />
            {t("modal:deeplink.DL.step3")}
          </Text>

          <a href={`rawbeet://api?chain=${relevantChain}&request=${airdropData}`}>
            <Button mt="md">
              {t("modal:deeplink.DL.beetBTN")}
            </Button>
          </a>
        </>
      );
    }
  } else if (method === "LOCAL") {
    // Enable JSON download
    if (!airdropData && !inProgress) {
      modalContents = (
        <>
          <Text>{t("modal:local.noGen.title")}</Text>
          <Text m="sm" fz="xs">
            {t("modal:local.noGen.step1")}
            <br />
            {t("modal:local.noGen.step2", { opNum: 0, opName: "Transfer" })}
            <br />
            {t("modal:local.noGen.step3")}
          </Text>
          <Button
            mt="md"
            onClick={() => setDeepLinkItr(deepLinkItr + 1)}
          >
            {t("modal:local.noGen.btn")}
          </Button>
        </>
      );
    } else if (airdropData) {
      modalContents = (
        <>
          <Text>{t("modal:local.generated.title")}</Text>
          <Text fz="xs">
            {t("modal:local.generated.step1")}
            <br />
            {t("modal:local.generated.step2")}
            <br />
            {t("modal:local.generated.step3")}
          </Text>

          <a
            href={`data:text/json;charset=utf-8,${airdropData}`}
            download={`airdrop_${chunkItr + 1}.json`}
            target="_blank"
            rel="noreferrer"
          >
            <Button mt="md">
              {t("modal:local.generated.beetBTN")}
            </Button>
          </a>
        </>
      );
    }
  } else if (method === "JSON") {
    // Enable JSON download
    if (tx) {
      modalContents = (
        <>
          <Accordion mt="xs">
            <Accordion.Item key="json" value="operation_json">
              <Accordion.Control>
                {t("modal:JSON.view")}
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
      );
    } else {
      modalContents = (
        <>
          <Button
            mt="md"
            onClick={() => setDeepLinkItr(deepLinkItr + 1)}
          >
            {t("modal:local.noGen.btn")}
          </Button>
        </>
      )
    }
  }

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
          setOutcome();
          setTX();
          setMethod();
          setInProgress();
          reset();
        }}
        title={`${t("airdropCard:airdrop")} #${chunkItr + 1}/${winnerChunkQty}`}
      >
        {
          modalContents
        }
        <br />
        {
          method
            ? (
              <Button
                mt="sm"
                compact
                variant="outline"
                onClick={() => {
                  setMethod();
                  setAirdropData();
                  setInProgress();
                  reset();
                }}
              >
                Go back
              </Button>
            )
            : null
        }
      </Modal>
      <Button mt="md" onClick={open}>{t("airdropCard:begin")}</Button>
    </Card>
  );
}
