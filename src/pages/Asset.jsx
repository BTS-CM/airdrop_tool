import React, { useState, useEffect } from 'react';
import {
  Title,
  Text,
  SimpleGrid,
  Card,
  Radio,
  Table,
  Badge,
  Button,
  ScrollArea,
  Group,
  ActionIcon,
  Loader,
} from '@mantine/core';
import { HiOutlineChartPie } from "react-icons/hi";
import { useTranslation } from 'react-i18next';
import { Link, useParams } from "react-router-dom";

import { appStore, ticketStore, leaderboardStore } from '../lib/states';
import { lookupSymbols } from '../lib/directQueries';

function humanReadableFloat(satoshis, precision) {
  return satoshis / 10 ** precision;
}

export default function Account(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const nodes = appStore((state) => state.nodes);
  const changeURL = appStore((state) => state.changeURL);

  const [assetDetails, setAssetDetails] = useState();
  const [inProgress, setInProgress] = useState(false);

  let currentLeaderboard = [];
  let assetName = "";
  let chainName = "";
  if (params.env === 'bitshares') {
    currentLeaderboard = btsLeaderboard;
    assetName = "BTS";
    chainName = "Bitshares";
  } else if (params.env === 'bitshares_testnet') {
    currentLeaderboard = btsTestnetLeaderboard;
    assetName = "TEST";
    chainName = "Bitshares (Testnet)";
  } else if (params.env === 'tusc') {
    currentLeaderboard = tuscLeaderboard;
    assetName = "TUSC";
    chainName = "TUSC";
  }

  useEffect(() => {
    async function fetchData() {
      let currentAsset;
      try {
        currentAsset = await lookupSymbols(nodes[params.env][0], params.env, [params.id])
      } catch (error) {
        console.log(error);
        setInProgress(false);
        changeURL(params.env);
        return;
      }

      if (currentAsset && currentAsset.length) {
        setAssetDetails(currentAsset[0]);
      }
      setInProgress(false);
    }
    if (params.env && params.id && !inProgress) {
      setInProgress(true);
      fetchData();
    }
  }, []);

  const ids = [];
  const foundBalances = currentLeaderboard
    .filter((user) => user.balances.filter((x) => x.asset_id === params.id).length > 0);

  const foundBalanceValues = foundBalances.map((user) => {
    return {
      value: user.balances.find((x) => x.asset_id === params.id).amount,
      id: user.id
    }
  }).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  
  const tableRows = foundBalanceValues.map((user) => (
    <tr key={user.id}>
      <td>
        <Link to={`/Account/${params.env}/${user.id}`} style={{ textDecoration: 'none' }}>
          {user.id}
        </Link>
      </td>
      <td>
        {
          assetDetails
            ? humanReadableFloat(user.value, assetDetails.precision).toLocaleString()
            : <Loader />
        }
      </td>
    </tr>
  ));

  let assetRows;
  if (assetDetails) {
    assetRows = [
      <Text>
        {t("asset:symbol")}: {assetDetails.symbol}
      </Text>,
      <Text>
        {t("asset:issuer")}: {assetDetails.issuer}
      </Text>,
      <Text>
        {t("asset:precision")}: {assetDetails.precision}
      </Text>,
      <Text>
        {t("asset:maxSupply")}: {
          humanReadableFloat(
            assetDetails.options.max_supply,
            assetDetails.precision
          ).toLocaleString()
        }
      </Text>,
      <Text>
        {t("asset:dynamicData")}: {assetDetails.dynamic_asset_data_id}
      </Text>,
      <br />,
      <Text>
        {t("asset:qty")}: {tableRows.length}
      </Text>,
      <Text>
        {t("asset:total")}: {
          humanReadableFloat(
            foundBalanceValues.reduce(
              (accumulator, ticket) => accumulator + parseInt(ticket.value, 10),
              0,
            ),
            assetDetails.precision,
          ).toLocaleString()
        }
      </Text>,
    ];
  }

  return (
    <SimpleGrid cols={2} spacing="sm" mt={10} breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <ScrollArea h={300}>
          <Table>
            <thead>
              <tr>
                <th>{t("asset:th1")}</th>
                <th>{t("asset:th2")}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows}
            </tbody>
          </Table>
        </ScrollArea>
      </Card>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={4}>{t("asset:title")}</Title>
        <Text>{t("asset:chain")}: {chainName}</Text>
        <Text>{t("asset:id")}: {params.id}</Text>
        {
          assetRows ?? null
        }
      </Card>
    </SimpleGrid>
  );
}
