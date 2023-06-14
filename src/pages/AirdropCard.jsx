import React, { useState, useEffect } from 'react';
import {
  Text,
  Card
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { tempStore } from '../lib/states';
import BeetModal from './BeetModal';

export default function modal(properties) {
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

  const currentChunkValue = distroMethod === "Proportionally"
    ? parseFloat(
      chunk
        .map((z) => ((z.qty / ticketQty) * tokenQuantity).toFixed(5))
        .reduce((accumulator, ticket) => accumulator + parseFloat(ticket), 0).toFixed(5)
    )
    : (((1 / quantityWinners) * tokenQuantity).toFixed(5)) * chunk.length;

  const ops = chunk.map((x) => ({
    fee: {
      amount: 0,
      asset_id: tokenDetails.id,
    },
    from: account,
    to: x.id,
    amount: {
      amount: parseFloat(
        distroMethod === "Proportionally"
          ? ((x.qty / ticketQty) * tokenQuantity).toFixed(tokenDetails.precision)
          : (((1 / quantityWinners) * tokenQuantity).toFixed(tokenDetails.precision)),
      ) * 100000,
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
