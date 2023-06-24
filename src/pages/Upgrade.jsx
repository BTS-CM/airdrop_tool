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
  appStore, leaderboardStore, airdropStore, ticketStore, tempStore
} from '../lib/states';

import BeetModal from './BeetModal';

export default function Upgrade(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const [value, setValue] = useState(
    (params && params.env) ?? 'bitshares'
  );

  const account = tempStore((state) => state.account);
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

        <BeetModal
          value={value}
          opContents={[{
            fee: {
              amount: 0,
              asset_id: "1.3.0"
            },
            account_to_upgrade: account,
            upgrade_to_lifetime_member: true,
            extensions: []
          }]}
          opType="account_upgrade"
          opNum={11}
          opName="Account upgrade"
          appName="Account_Upgrade"
          requestedMethods={["BEET", "DEEPLINK", "LOCAL", "JSON", "QR"]}
          filename="account_upgrade.json"
        />
    </Card>
  );
}
