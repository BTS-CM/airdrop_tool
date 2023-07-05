/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  SimpleGrid,
  Badge,
  Card,
  Radio,
  Table,
  Button,
  ScrollArea,
  Center,
  Group,
  Tooltip,
  Accordion,
  NumberInput,
  JsonInput,
  Loader,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import { Apis } from "bitsharesjs-ws";

import {
  airdropStore, appStore, leaderboardStore, beetStore, tempStore
} from "../lib/states";
import AccountSearch from "./AccountSearch";
import Connect from "./Connect";
import BeetLink from "./BeetLink";

export default function GetAccount(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const { beetOnly } = properties;
  const { env } = properties;
  const { basic } = properties;

  const setConnection = beetStore((state) => state.setConnection);
  const setAuthenticated = beetStore((state) => state.setAuthenticated);

  // for beet use
  const connection = beetStore((state) => state.connection);
  const isLinked = beetStore((state) => state.isLinked);
  const identity = beetStore((state) => state.identity);
  const [accountMethod, setAccountMethod] = useState();

  const account = tempStore((state) => state.account);

  let assetName = "";
  let titleName = "token";
  let relevantChain = "";

  if (env === 'bitshares' || params.env === 'bitshares') {
    assetName = "BTS";
    relevantChain = 'BTS';
    titleName = "Bitshares";
  } else if (env === 'bitshares_testnet' || params.env === 'bitshares_testnet') {
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    titleName = "Bitshares (Testnet)";
  } else if (env === 'tusc' || params.env === 'tusc') {
    assetName = "TUSC";
    relevantChain = 'TUSC';
    titleName = "TUSC";
  }

  return (
    <Card shadow={basic ? "" : "md"} radius="md" padding="sm" style={{ marginTop: '25px' }}>
      <Title order={4} align="center">
        {
          !accountMethod
            ? t("getAccount:title", { chain: titleName })
            : null
        }
      </Title>
      <Text size="lg" align="center">
        {
          !accountMethod
            ? t("getAccount:subtitle")
            : null
        }
      </Text>
      {
        !account && !accountMethod && !beetOnly
          ? (
            <Center>
              <Group mt="sm">
                <Button
                  compact
                  onClick={() => setAccountMethod("SEARCH")}
                >
                  {t("getAccount:search")}
                </Button>
                <Button
                  compact
                  onClick={() => setAccountMethod("BEET")}
                >
                  {t("getAccount:beet")}
                </Button>
              </Group>
            </Center>
          )
          : null
      }

      {
        !account && accountMethod === "SEARCH"
          ? (
            <>
              <AccountSearch env={env || params.env} />
              <Center>
                <Button onClick={() => setAccountMethod()}>
                  {t('beet:beetlink.backButton')}
                </Button>
              </Center>
            </>
          )
          : null
      }

      {
        !identity && (beetOnly || accountMethod === "BEET")
          ? (
          <>
            {
              !connection
                ? (
                  <span>
                    <Connect relevantChain={relevantChain} />
                  </span>
                )
                : null
            }
            {
              connection && !isLinked
                ? (
                  <span>
                    <Text size="md">
                      {t('beet:accountMode.linkPrompt')}
                    </Text>
                    <BeetLink env={relevantChain} />
                  </span>
                )
                : null
            }

            {
              !beetOnly
                ? (
                  <Center>
                    <Button
                      onClick={() => {
                        setAccountMethod();
                        setConnection();
                        setAuthenticated();
                      }}
                    >
                      Go back
                    </Button>
                  </Center>
                )
                : null
            }
          </>
          )
          : null
      }
    </Card>
  );
}
