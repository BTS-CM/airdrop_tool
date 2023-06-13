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

function sliceIntoChunks(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Convert the token's blockchain representation into a human readable quantity
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function humanReadableFloat(satoshis, precision) {
  return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

/**
 * Convert human readable quantity into the token's blockchain representation
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function blockchainFloat(satoshis, precision) {
  return satoshis * 10 ** precision;
}

/**
 * Retrieve the details of an asset from the blockchain
 * @param {String} node
 * @param {String} searchInput
 * @param {String} env
 * @returns {Object}
 */
async function getAsset(node, searchInput, env) {
  try {
    await Apis.instance(node, true).init_promise;
  } catch (error) {
    console.log(error);
    const { changeURL } = appStore.getState();
    changeURL(env);
    return;
  }

  let symbols;
  try {
    symbols = await Apis.instance()
      .db_api()
      .exec('lookup_asset_symbols', [[searchInput]]);
  } catch (error) {
    console.log(error);
    return;
  }

  const filteredSymbols = symbols.filter((x) => x !== null);
  if (!filteredSymbols || !filteredSymbols.length) {
    console.log("No results");
    return;
  }

  return filteredSymbols[0];
}

export default function GetAccount(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  /*
  const btsAirdrops = airdropStore((state) => state.bitshares);
  const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet);
  const tuscAirdrops = airdropStore((state) => state.tusc);

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);
  */

  const setConnection = beetStore((state) => state.setConnection);
  const setAuthenticated = beetStore((state) => state.setAuthenticated);

  // for beet use
  const connection = beetStore((state) => state.connection);
  const isLinked = beetStore((state) => state.isLinked);
  const identity = beetStore((state) => state.identity);
  const reset = beetStore((state) => state.reset);

  const [inProgress, setInProgress] = useState();
  const [myID, setMyID] = useState();
  const [accountMethod, setAccountMethod] = useState();

  const account = tempStore((state) => state.account);
  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[params.env];

  let assetName = "";
  let titleName = "token";
  let relevantChain = "";

  if (params.env === 'bitshares') {
    assetName = "BTS";
    relevantChain = 'BTS';
    titleName = "Bitshares";
  } else if (params.env === 'bitshares_testnet') {
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    titleName = "Bitshares (Testnet)";
  } else if (params.env === 'tusc') {
    assetName = "TUSC";
    relevantChain = 'TUSC';
    titleName = "TUSC";
  }

  return (
    <Card shadow="md" radius="md" padding="sm" style={{ marginTop: '25px' }}>
      <Text size="md" align="center">
        {
          !accountMethod
            ? t("getAccount:title")
            : null
        }
      </Text>
      {
        !account && !accountMethod
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
              <AccountSearch env={params.env} />
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
        !account && accountMethod === "BEET"
          ? (
          <>
            {
              !connection
                ? (
                  <span>
                    <Text size="md">
                      {t('beet:accountMode.beetPrompt')}
                    </Text>
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
          </>
          )
          : null
      }
    </Card>
  );
}
