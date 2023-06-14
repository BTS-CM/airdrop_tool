/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';

import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  SimpleGrid,
  TextInput,
  Loader,
  Card,
  Accordion,
  Box,
  JsonInput,
  Modal,
  Radio,
  Table,
  Button,
  Col,
  Paper,
  Group,
  Badge,
} from '@mantine/core';
import { Link, useParams } from "react-router-dom";

import {
  leaderboardStore, appStore, tempStore, beetStore
} from '../lib/states';
import { generateDeepLink } from '../lib/generate';
import GetAccount from './GetAccount';

/**
 * Convert human readable quantity into the token's blockchain representation
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function blockchainFloat(satoshis, precision) {
  return satoshis * 10 ** precision;
}

export default function Create(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const [value, setValue] = useState(
    (params && params.env) ?? 'bitshares'
  );
  const [ticketType, setTicketType] = useState("lock_180_days");
  const [deepLink, setDeepLink] = useState();
  const [accountID, onAccountID] = useState((params && params.id) ?? "1.2.x");

  const [deepLinkItr, setDeepLinkItr] = useState(0);

  const [tokenQuantity, onTokenQuantity] = useState(1);
  const [opened, { open, close }] = useDisclosure(false);

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const connection = beetStore((state) => state.connection);
  const isLinked = beetStore((state) => state.isLinked);
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

  let relevantChain = "bitshares";
  let assetName = "1.3.0";
  let leaderboardJSON = [];
  let currentlyLocked = 0;

  if (value === 'bitshares') {
    leaderboardJSON = btsLeaderboard;
    currentlyLocked = btsLeaderboard
      .reduce((accumulator, entry) => accumulator + parseInt(entry.amount, 10), 0);
    assetName = "BTS";
    relevantChain = 'BTS';
  } else if (value === 'bitshares_testnet') {
    leaderboardJSON = btsTestnetLeaderboard;
    currentlyLocked = btsTestnetLeaderboard
      .reduce((accumulator, entry) => accumulator + parseInt(entry.amount, 10), 0);
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
  } else if (value === 'tusc') {
    leaderboardJSON = tuscLeaderboard;
    currentlyLocked = tuscLeaderboard
      .reduce((accumulator, entry) => accumulator + parseInt(entry.amount, 10), 0);
    assetName = "TUSC";
    relevantChain = 'TUSC';
  }

  let targetType = 0;
  let tokenLockValue = 0;
  if (ticketType === "lock_180_days") {
    targetType = 1;
    tokenLockValue = tokenQuantity * 2;
  } else if (ticketType === "lock_360_days") {
    targetType = 2;
    tokenLockValue = tokenQuantity * 4;
  } else if (ticketType === "lock_720_days") {
    targetType = 3;
    tokenLockValue = tokenQuantity * 8;
  } else {
    targetType = 4;
    tokenLockValue = tokenQuantity * 8;
  }

  useEffect(() => {
    async function fetchData() {
      const opContents = [{
        account,
        target_type: targetType,
        amount: {
          amount: blockchainFloat(tokenQuantity, 5),
          asset_id: "1.3.0",
        },
        extensions: []
      }];

      setTX(opContents);

      let payload;
      try {
        payload = await generateDeepLink(
          'create_ticket',
          relevantChain,
          currentNodes[0],
          'ticket_create',
          opContents
        );
      } catch (error) {
        console.log(error);
        return;
      }

      if (payload && payload.length) {
        //setDeepLink(`rawbeet://api?chain=${relevantChain}&request=${payload}`);
        setDeepLink(payload);
      }
    }

    if (deepLinkItr && deepLinkItr > 0) {
      fetchData();
    }
  }, [deepLinkItr]);

  async function broadcast() {
    console.log('broadcast');
  }

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          {t("create:title")}
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label={t("create:radioA.label")}
          description={t("create:radioA.desc")}
          withAsterisk
        >
          <Group mt="xs">
            <Radio value="bitshares" label="Bitshares" />
            <Radio value="bitshares_testnet" label="Bitshares (Testnet)" />
            <Radio value="tusc" label="TUSC" />
          </Group>
        </Radio.Group>

        <Radio.Group
          value={ticketType}
          onChange={setTicketType}
          name="lockType"
          label={t("create:radioB.label")}
          description={t("create:radioB.desc")}
          style={{ marginTop: '20px' }}
          withAsterisk
        >
          <Group mt="xs">
            <Radio value="lock_180_days" label={t("create:radioB.sm")} />
            <Radio value="lock_360_days" label={t("create:radioB.md")} />
            <Radio value="lock_720_days" label={t("create:radioB.lg")} />
            <Radio value="lock_forever" label={t("create:radioB.xl")} />
          </Group>
        </Radio.Group>

        <TextInput
          type="number"
          placeholder={tokenQuantity}
          label={t("create:qty")}
          style={{ maxWidth: '300px', marginTop: '20px' }}
          onChange={(event) => onTokenQuantity(event.currentTarget.value)}
        />

        <Text fz="md" style={{ marginTop: '15px' }}>
          {t("create:text.lock")}
          {' '}
          {tokenQuantity}
          {' '}
          {assetName}
          {' '}
          {t("create:text.equivalent")}
          {' '}
          {tokenLockValue}
          {' '}
          {assetName}
          {' '}
          {t("create:text.area")}
        </Text>

        <Modal
          opened={opened}
          onClose={() => {
            setDeepLink();
            close();
            setAccount("");
            setOutcome();
            setTX();
            setMethod();
            setInProgress();
            reset();
          }}
          title={t("modal:deeplink.title")}
        >
          {
            inProgress
              ? <Loader size="xs" variant="dots" />
              : null
          }
          {
            !account
              ? <GetAccount token={value ?? null} env={value ?? null} />
              : null
          }
          {
            account && !method
              ? (
                <>
                  <Text>How do you want to proceed?</Text>
                  <Group mt="sm">
                    <Button compact onClick={() => setMethod("BEET")}>BEET</Button>
                    <Button compact onClick={() => setMethod("DEEPLINK")}>Deeplink</Button>
                    <Button compact onClick={() => setMethod("LOCAL")}>Local file</Button>
                    <Button compact onClick={() => setMethod("JSON")}>View JSON</Button>
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
                  <GetAccount beetOnly />
                </>
              )
              : null
          }
          {
            account && method && method === "BEET" && connection && identity
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
                    {t("modal:local.noGen.step2", { opNum: 57, opName: "Create Ticket" })}
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
                    {t("modal:local.noGen.step2", { opNum: 57, opName: "Create Ticket" })}
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
                    download="create_ticket.json"
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
          <br/>
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
      </Card>

      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={5} ta="center" mt="xs">
          {t("create:leaderChange.title")}
        </Title>
        <Table miw={800} verticalSpacing="sm" mt="md">
          <thead>
            <tr>
              <th align="left">{t("create:leaderChange.th1")}</th>
              <th align="left">{t("create:leaderChange.th2")}</th>
              <th align="left">{t("create:leaderChange.th3")}</th>
              <th align="left">{t("create:leaderChange.th4")}</th>
            </tr>
          </thead>
          <tbody>
            {
              leaderboardJSON.slice(0, 10).map((leader) => (
                <tr key={leader.id}>
                  <td>{leader.id}</td>
                  <td>{leader.amount}</td>
                  <td>
                    {leader.percent.toFixed(2)}
                    {' '}
                    %
                  </td>
                  <td>
                    {((leader.amount / (currentlyLocked + tokenLockValue)) * 100).toFixed(2)}
                    {' '}
                    %
                  </td>
                </tr>
              ))
            }
          </tbody>
        </Table>
      </Card>
    </>
  );
}
