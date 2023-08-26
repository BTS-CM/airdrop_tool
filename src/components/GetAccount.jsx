/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from "react-router-dom";
import {
  Title,
  Text,
  Card,
  Button,
  Center,
  Group,
  Paper,
  Box,
  ScrollArea,
  Table
} from '@mantine/core';

import { HiArrowNarrowLeft, HiOutlineReply } from "react-icons/hi";

import {
  beetStore, tempStore, identitiesStore
} from "../lib/states";
import AccountSearch from "./AccountSearch";
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
  const setIsLinked = beetStore((state) => state.setIsLinked);
  const identity = beetStore((state) => state.identity);
  const setIdentity = beetStore((state) => state.setIdentity);
  const [accountMethod, setAccountMethod] = useState();

  const account = tempStore((state) => state.account);
  const setAccount = tempStore((state) => state.setAccount);

  const identities = identitiesStore((state) => state.identities);
  //const setIdentities = identitiesStore((state) => state.setIdentities);
  const removeIdentity = identitiesStore((state) => state.removeIdentity);
  const removeConnection = identitiesStore((state) => state.removeConnection);

  /**
   * Removing a previously linked identity from the identity store
   * @param {Object} rowIdentity
   */
  function remove(rowIdentity) {
    try {
      removeIdentity(rowIdentity.requested.account.id);
    } catch (error) {
      console.log(error);
    }

    try {
      removeConnection(rowIdentity.identityhash);
    } catch (error) {
      console.log(error);
    }
  }

  let assetName = "";
  let titleName = "token";
  let relevantChain = "";

  if (env === 'bitshares') {
    assetName = "BTS";
    relevantChain = 'BTS';
    titleName = "Bitshares";
  } else if (env === 'bitshares_testnet') {
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    titleName = "Bitshares (Testnet)";
  } else if (env === 'tusc') {
    assetName = "TUSC";
    relevantChain = 'TUSC';
    titleName = "TUSC";
  }

  useEffect(() => {
    if (!account && identity && identity.requested.account && identity.requested.account.id) {
      console.log("Identity set via BEET")
      setAccount(identity.requested.account.id);
    }
  }, [account, identity]);

  const relevantIdentities = identities.filter((x) => x.chain === relevantChain);
  const rows = relevantIdentities
    .map((row) => (
      <tr key={`${row.requested.account.name}_row`}>
        <td>
          <Button
            variant="light"
            sx={{ marginTop: '5px', marginRight: '5px' }}
            onClick={() => {
              setAccount(row.requested.account.id);
              setIsLinked(true);
              setIdentity(row);
            }}
          >
            {row.requested.account.name}
            {' '}
            (
            {row.requested.account.id}
            )
          </Button>
          <Button
            sx={{ marginTop: '5px' }}
            variant="subtle"
            color="red"
            compact
            onClick={() => {
              remove(row);
            }}
          >
            Remove
          </Button>
        </td>
      </tr>
    ))
    .filter((x) => x);

  return (
    <Card shadow={basic ? "" : "md"} radius="md" padding="sm">
      <Title order={4} align="center">
        {
          !accountMethod
            ? t("getAccount:title", {chain: titleName})
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
                <Button
                  variant='light'
                  leftIcon={<HiArrowNarrowLeft />}
                  onClick={() => setAccountMethod()}
                >
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
              !isLinked
                ? (
                  <span>
                    <Text size="md">
                      {t('beet:accountMode.linkPrompt')}
                    </Text>
                    {
                      rows && rows.length > 0
                        ? (
                          <Paper padding="sm" shadow="xs">
                            <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
                              <Text size="md">
                                {t('beet:connect.previousBEET')}
                              </Text>
                              <ScrollArea
                                sx={{ height: rows.length > 1 && rows.length < 3 ? rows.length * 55 : 120 }}
                              >
                                <Table sx={{ minWidth: 700 }}>
                                  <tbody>{rows}</tbody>
                                </Table>
                              </ScrollArea>
                            </Box>
                          </Paper>
                        )
                        : null
                    }
                    <br />
                    <BeetLink env={env || params.env} />
                  </span>
                )
                : null
            }

            {
              !beetOnly
                ? (
                  <Center>
                    <Button
                      leftIcon={<HiOutlineReply />}
                      compact
                      variant="outline"
                      onClick={() => {
                        setAccountMethod();
                        setConnection();
                        setAuthenticated();
                      }}
                    >
                      {t('beet:beetlink.backButton')}
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
