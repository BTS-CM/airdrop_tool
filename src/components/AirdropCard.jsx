import React, { useState, useEffect } from 'react';
import {
  Text,
  Card
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { tempStore } from '../lib/states';
import BeetModal from '../pages/BeetModal';

export default function AirdropCard(properties) {
  const { t, i18n } = useTranslation();

  const { tokenQuantity } = properties;
  const { tokenName } = properties;
  const { distroMethod } = properties;

  const { chunk } = properties;
  const { chunkItr } = properties;
  const { winnerChunkQty } = properties;
  const { env } = properties;
  const { ticketQty } = properties;
  const { tokenDetails } = properties;
  const { quantityWinners } = properties;

  const account = tempStore((state) => state.account);

  let assetName = "";
  let relevantChain = "";
  if (env === 'bitshares') {
    assetName = "BTS";
    relevantChain = 'BTS';
  } else if (env === 'bitshares_testnet') {
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
  } else if (env === 'tusc') {
    assetName = "TUSC";
    relevantChain = 'TUSC';
  }

  const currentChunkValue = chunk
    .map((z) => z.assignedTokens)
    .reduce((accumulator, ticket) => accumulator + ticket, 0);

  const ops = chunk.map((x) => ({
    fee: {
      amount: 0,
      asset_id: "1.3.0",
    },
    from: account,
    to: x.id,
    amount: {
      amount: x.assignedTokens,
      asset_id: tokenDetails.id,
    },
  }));

  return (
    <Card key={`airdrop_${chunkItr}`} mt="md" shadow="md" radius="md" padding="xl">
      <Text>
        {t("airdropCard:airdrop")} #
        {chunkItr + 1}
        /
        {winnerChunkQty}
      </Text>
      <Text fz="sm" c="dimmed">
        {`${chunk.length} ${t("airdropCard:accounts")} ${chunk.length > 1 ? `(${t("airdropCard:from")} ${chunk[0].id} ${t("airdropCard:to")} ${chunk[chunk.length - 1].id})` : ''}`}
        <br />
        { `${currentChunkValue} ${tokenName || assetName} ${t("airdropCard:distro")}` }
      </Text>
      <BeetModal
        value={env}
        opContents={ops}
        opType="transfer"
        opNum={0}
        opName="Transfer"
        appName="Transfer"
        requestedMethods={["BEET", "LOCAL", "JSON"]}
        filename="airdrop.json"
      />
    </Card>
  );
}
