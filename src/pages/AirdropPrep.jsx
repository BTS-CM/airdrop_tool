/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  Card,
  Center,
  Button,
} from '@mantine/core';
import _ from "lodash";

import {
  airdropStore,
  appStore,
  leaderboardStore,
  beetStore,
  tempStore,
  assetStore,
  blocklistStore,
} from "../lib/states";

import GetAccount from "./GetAccount";

export default function AirdropPrep(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const btsAirdrops = airdropStore((state) => state.bitshares);
  const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet);
  const tuscAirdrops = airdropStore((state) => state.tusc);
  const updateOne = airdropStore((state) => state.updateOne);

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const btsBlockedAccounts = blocklistStore((state) => state.bitshares);
  const btsTestnetBlockedAccounts = blocklistStore((state) => state.bitshares_testnet);
  const tuscBlockedAccounts = blocklistStore((state) => state.tusc);

  const btsAssets = assetStore((state) => state.bitshares);
  const btsTestnetAssets = assetStore((state) => state.bitshares_testnet);
  const tuscAssets = assetStore((state) => state.tusc);
  const addOne = assetStore((state) => state.addOne);

  let assetName = "";
  let titleName = "token";
  let relevantChain = "";
  let plannedAirdropData = {};
  let envLeaderboard = [];
  let cachedAssets = [];
  let blockList = [];

  if (params.env === 'bitshares') {
    plannedAirdropData = btsAirdrops.find((x) => params.id === x.id);
    envLeaderboard = btsLeaderboard;
    assetName = "BTS";
    relevantChain = 'BTS';
    titleName = "Bitshares";
    cachedAssets = btsAssets;
    blockList = btsBlockedAccounts;
  } else if (params.env === 'bitshares_testnet') {
    plannedAirdropData = btsTestnetAirdrops.find((x) => params.id === x.id);
    envLeaderboard = btsTestnetLeaderboard;
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    titleName = "Bitshares (Testnet)";
    cachedAssets = btsTestnetAssets;
    blockList = btsTestnetBlockedAccounts;
  } else if (params.env === 'tusc') {
    plannedAirdropData = tuscAirdrops.find((x) => params.id === x.id);
    envLeaderboard = tuscLeaderboard;
    assetName = "TUSC";
    relevantChain = 'TUSC';
    titleName = "TUSC";
    cachedAssets = tuscAssets;
    blockList = tuscBlockedAccounts;
  }

  // Beet
  const account = tempStore((state) => state.account);

  return (
    <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
      <Title order={3} ta="center" mt="sm">
        {t("airdropPrep:header1.title", { titleName })}
      </Title>

      {
        !plannedAirdropData && !account
          ? <Text>{t("airdropPrep:noTicket")}</Text>
          : null
      }

      {
        !account
          ? <GetAccount basic />
          : null
      }

      {
        plannedAirdropData && account
          ? (
            <>
            <Center>
              <Card shadow="md" radius="md" mt="md" withBorder style={{ width: 450 }}>
                <Center>
                    <Text>{t("airdropPrep:header2.title", { titleName })}</Text>
                </Center>
                <Center>
                    <Link to={`/PerformAirdrop/${params.env}/${params.id}`}>
                      <Button mt="sm" compact>
                        {t("airdropPrep:header2.button", { accountName: account })}
                      </Button>
                    </Link>
                </Center>
              </Card>
            </Center>
            </>
          )
          : null
      }

      <Center mt="md">
        <Link to={`/PlannedAirdrop/${params.env}/${params.id}`}>
          <Button variant="outline" compact>
            {t("airdropPrep:header1.back")}
          </Button>
        </Link>
      </Center>
    </Card>
  );
}
