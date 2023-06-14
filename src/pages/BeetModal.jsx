/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Text,
  Loader,
  Accordion,
  JsonInput,
  Modal,
  Button,
  Group,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useParams } from "react-router-dom";

import {
  appStore, tempStore, beetStore
} from '../lib/states';
import { generateDeepLink, beetBroadcast } from '../lib/generate';
import GetAccount from './GetAccount';

export default function BeetModal(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const { value } = properties; // 'bitshares'
  const { opContents } = properties; // [{op}, ...]
  const { opType } = properties; // submit to blockchain
  const { opNum } = properties; // include in i18n
  const { opName } = properties; // include in i18n
  const { appName } = properties; // include in deeplink/local
  const { requestedMethods } = properties; // avoid bugged deeplinks
  const { filename } = properties; // for local json file

  const [deepLink, setDeepLink] = useState();
  const [deepLinkItr, setDeepLinkItr] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);

  const connection = beetStore((state) => state.connection);
  const identity = beetStore((state) => state.identity);
  const reset = beetStore((state) => state.reset);

  const account = tempStore((state) => state.account);
  const setAccount = tempStore((state) => state.setAccount);

  const [tx, setTX] = useState();
  const [inProgress, setInProgress] = useState(false);

  const [outcome, setOutcome] = useState();
  const [method, setMethod] = useState();

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[value];

  let assetName = "1.3.0";
  let relevantChain = "bitshares";
  if (value === 'bitshares') {
    assetName = "BTS";
    relevantChain = 'BTS';
  } else if (value === 'bitshares_testnet') {
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
  } else if (value === 'tusc') {
    assetName = "TUSC";
    relevantChain = 'TUSC';
  }

  useEffect(() => {
    async function fetchData() {
      setTX(opContents);

      let payload;
      try {
        payload = await generateDeepLink(
          appName,
          relevantChain,
          currentNodes[0],
          opType,
          opContents
        );
      } catch (error) {
        console.log(error);
        return;
      }

      if (payload && payload.length) {
        setDeepLink(payload);
      }
    }

    if (deepLinkItr && deepLinkItr > 0) {
      fetchData();
    }
  }, [deepLinkItr]);

  async function broadcast() {
    setInProgress(true);
    setOutcome();
    let response;
    try {
      response = await beetBroadcast(
        connection,
        relevantChain,
        currentNodes[0],
        opType,
        opContents
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

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          setDeepLink();
          close();
          setOutcome();
          setTX();
          setMethod();
          setInProgress();
          reset();
        }}
        title={t("modal:title")}
      >
        {
          inProgress
            ? <Loader size="xs" variant="dots" />
            : null
        }
        {
          !account
            ? <GetAccount basic token={value} env={value} />
            : null
        }
        {
          account && !method
            ? (
              <>
                <Text>How do you want to proceed?</Text>
                <Group mt="sm">
                  {
                    requestedMethods && requestedMethods.includes("BEET")
                      ? <Button compact onClick={() => setMethod("BEET")}>BEET</Button>
                      : null
                  }
                  { // Won't work for large airdrops due to 2k url char limit in chromium
                    requestedMethods && requestedMethods.includes("DEEPLINK")
                      ? <Button compact onClick={() => setMethod("DEEPLINK")}>Deeplink</Button>
                      : null
                  }
                  {
                    requestedMethods && requestedMethods.includes("LOCAL")
                      ? <Button compact onClick={() => setMethod("LOCAL")}>Local file</Button>
                      : null
                  }
                  {
                    requestedMethods && requestedMethods.includes("JSON")
                      ? <Button compact onClick={() => setMethod("JSON")}>View JSON</Button>
                      : null
                  }
                </Group>
              </>
            )
            : null
        }
        {
          account && outcome && outcome === "SUCCESS"
            ? (
              <>
                <Text>Successfully broadcast to the blockchain!</Text>
                <Button onClick={() => {
                  setDeepLink();
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
            : null
        }
        {
          account && outcome && outcome === "FAILURE"
            ? (
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
            : null
        }
        {
          account && method && method === "BEET" && !identity
            ? (
              <>
                <GetAccount beetOnly token={value ?? null} env={value ?? null} />
              </>
            )
            : null
        }
        {
          account && method && method === "BEET" && connection && identity && !outcome
            ? (
              <>
                <Text>Ready to broadcast airdrop to BEET wallet</Text>
                <Text>{identity.chain}</Text>
                <Button mt="sm" onClick={async () => await broadcast()}>
                  {t("modal:deeplink.DL.beetBTN")}
                </Button>
              </>
            )
            : null
        }
        {
          account && method && method === "DEEPLINK" && !deepLink && !inProgress
            ? (
              <>
                <Text>{t("modal:local.noGen.title")}</Text>
                <Text m="sm" fz="xs">
                  {t("modal:local.noGen.step1")}
                  <br />
                  {t("modal:local.noGen.step2", { opNum, opName })}
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
            )
            : null
        }
        {
          account && method && method === "DEEPLINK" && deepLink
            ? (
              <>
                <Text>{t("modal:deeplink.DL.title")}</Text>
                <Text fz="xs">
                  1. {t("modal:deeplink.DL.step1")}
                  <br />
                  2. {t("modal:deeplink.DL.step2")}
                  <br />
                  3. {t("modal:deeplink.DL.step3")}
                </Text>
                <a href={`rawbeet://api?chain=${relevantChain}&request=${deepLink}`}>
                  <Button m="xs">
                    {t("modal:deeplink.DL.beetBTN")}
                  </Button>
                </a>
              </>
            )
            : null
        }
        {
          account && method && method === "LOCAL" && !deepLink && !inProgress
            ? (
              <>
                <Text>{t("modal:local.noGen.title")}</Text>
                <Text m="sm" fz="xs">
                  {t("modal:local.noGen.step1")}
                  <br />
                  {t("modal:local.noGen.step2", { opNum, opName })}
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
            )
            : null
        }
        {
          account && method && method === "LOCAL" && deepLink
            ? (
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
                  href={`data:text/json;charset=utf-8,${deepLink}`}
                  download={filename}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button mt="md">
                    {t("modal:local.generated.beetBTN")}
                  </Button>
                </a>
              </>
            )
            : null
        }
        {
          account && method && method === "JSON" && !tx
            ? (
              <>
                <Button
                  mt="md"
                  onClick={() => setDeepLinkItr(deepLinkItr + 1)}
                >
                  {t("modal:local.noGen.btn")}
                </Button>
              </>
            )
            : null
        }
        {
          account && method && method === "JSON" && tx
            ? (
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
            )
            : null
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
                setDeepLink();
                setInProgress();
                reset();
                setOutcome();
              }}
            >
              Go back
            </Button>
          )
          : null
        }
      </Modal>
      <Group position="center">
        <Button style={{ marginTop: '20px' }} onClick={open}>
          {t("create:askBEET")}
        </Button>
      </Group>
    </>
  );
}
