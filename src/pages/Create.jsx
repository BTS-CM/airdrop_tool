/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';

import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  SimpleGrid,
  TextInput,
  Card,
  Box,
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

import { leaderboardStore, appStore } from '../lib/states';
import { generateDeepLink } from '../lib/generate';

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
        account: accountID,
        target_type: targetType,
        amount: {
          amount: blockchainFloat(tokenQuantity, 5),
          asset_id: "1.3.0",
        },
        extensions: []
      }];

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
        setDeepLink(`rawbeet://api?chain=${relevantChain}&request=${payload}`);
      }
    }

    if (deepLinkItr && deepLinkItr > 0) {
      fetchData();
    }
  }, [deepLinkItr]);

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
          }}
          title={t("create:modal.title")}
        >
          {
            !deepLink
              ? (
                <>
                  <Text>{t("create:modal.noDL.title")}</Text>
                  <Text m="sm" fz="xs">
                    1. {t("create:modal.noDL.step1")}
                    <br />
                    2. {t("create:modal.noDL.step2")}
                    <br />
                    3. {t("create:modal.noDL.step3")}
                  </Text>
                  <TextInput
                    type="string"
                    placeholder={accountID}
                    m="sm"
                    label={t("create:modal.noDL.label")}
                    style={{ maxWidth: '300px' }}
                    onChange={(event) => onAccountID(event.currentTarget.value)}
                  />
                  {
                    accountID !== "1.2.x" && accountID.length > 4 && accountID.includes("1.2.")
                      ? (
                        <Button
                          m="xs"
                          onClick={() => setDeepLinkItr(deepLinkItr + 1)}
                        >
                          {t("create:modal.noDL.btn")}
                        </Button>
                      )
                      : (
                        <Button m="xs" disabled>
                          {t("create:modal.noDL.btn")}
                        </Button>
                      )
                  }
                </>
              )
              : null
          }
          {
            deepLink
              ? (
                <>
                  <Text>{t("create:modal.DL.title")}</Text>
                  <Text fz="xs">
                    1. {t("create:modal.DL.step1")}
                    <br />
                    2. {t("create:modal.DL.step2")}
                    <br />
                    3. {t("create:modal.DL.step3")}
                  </Text>
                  <a href={deepLink}>
                    <Button m="xs">
                      {t("create:modal.DL.beetBTN")}
                    </Button>
                  </a>
                  <Button
                    m="xs"
                    onClick={() => {
                      setDeepLink();
                    }}
                  >
                    {t("create:modal.DL.back")}
                  </Button>
                </>
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
