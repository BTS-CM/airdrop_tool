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

import { generateDeepLink } from '../lib/generate';
import {
  appStore, leaderboardStore, airdropStore, ticketStore
} from '../lib/states';

export default function Upgrade(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const [value, setValue] = useState(
    (params && params.env) ?? 'bitshares'
  );
  const [deepLink, setDeepLink] = useState();
  const [accountID, onAccountID] = useState((params && params.id) ?? "1.2.x");
  const [deepLinkItr, setDeepLinkItr] = useState(0);

  const [opened, { open, close }] = useDisclosure(false);

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[value];

  let relevantChain = "bitshares";
  if (value === 'bitshares') {
    relevantChain = 'BTS';
  } else if (value === 'bitshares_testnet') {
    relevantChain = 'BTS_TEST';
  } else if (value === 'tusc') {
    relevantChain = 'TUSC';
  }

  useEffect(() => {
    async function fetchData() {
      let payload;
      try {
        payload = await generateDeepLink(
          'airdrop_tool_account_upgrade',
          relevantChain,
          currentNodes[0],
          'account_upgrade',
          [{
            account_to_upgrade: accountID,
            upgrade_to_lifetime_member: true,
            extensions: []
          }]
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
    <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          {t("upgrade:title")}
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label={t("upgrade:radioA.label")}
          description={t("upgrade:radioA.desc")}
          withAsterisk
        >
          <Group mt="xs">
            <Radio value="bitshares" label="Bitshares" />
            <Radio value="bitshares_testnet" label="Bitshares (Testnet)" />
            <Radio value="tusc" label="TUSC" />
          </Group>
        </Radio.Group>

        <Text fz="md" style={{ marginTop: '15px' }}>
          {t("upgrade:header")}
        </Text>

        <Text fz="sm" style={{ marginTop: '15px' }}>
          {t("upgrade:secondHeader")}
        </Text>

        <Modal
          opened={opened}
          onClose={() => {
            setDeepLink();
            close();
          }}
          title={t("upgrade:modal.title")}
        >
          {
            !deepLink
              ? (
                <>
                  <Text>{t("upgrade:modal.noDL.title")}</Text>
                  <Text m="sm" fz="xs">
                    1. {t("upgrade:modal.noDL.step1")}
                    <br />
                    2. {t("upgrade:modal.noDL.step2")}
                    <br />
                    3. {t("upgrade:modal.noDL.step3")}
                  </Text>
                  <TextInput
                    type="string"
                    placeholder={accountID}
                    m="sm"
                    label={t("upgrade:modal.noDL.label")}
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
                          {t("upgrade:modal.noDL.btn")}
                        </Button>
                      )
                      : (
                        <Button m="xs" disabled>
                          {t("upgrade:modal.noDL.btn")}
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
                  <Text>{t("upgrade:modal.DL.title")}</Text>
                  <Text fz="xs">
                    1. {t("upgrade:modal.DL.step1")}
                    <br />
                    2. {t("upgrade:modal.DL.step2")}
                    <br />
                    3. {t("upgrade:modal.DL.step3")}
                  </Text>
                  <a href={deepLink}>
                    <Button m="xs">
                      {t("upgrade:modal.DL.beetBTN")}
                    </Button>
                  </a>
                  <Button
                    m="xs"
                    onClick={() => {
                      setDeepLink();
                    }}
                  >
                    {t("upgrade:modal.DL.back")}
                  </Button>
                </>
              )
              : null
          }
        </Modal>

        <Group position="center">
          <Button style={{ marginTop: '20px' }} onClick={open}>
            {t("upgrade:askBEET")}
          </Button>
        </Group>
    </Card>
  );
}
