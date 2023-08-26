import React, { useState, useEffect, useMemo } from 'react';
import {
  Text,
  Card,
  Button,
  Center
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { appStore, tempStore } from '../lib/states';
import BeetModal from './BeetModal';

import { blockchainFloat } from '../lib/common';

export default function AirdropCard(properties) {
  const { t, i18n } = useTranslation();

  const { tokenName } = properties;
  const { chunk } = properties;
  const { chunkItr } = properties;
  const { winnerChunkQty } = properties;
  const { env } = properties;
  const { tokenDetails } = properties;

  const account = tempStore((state) => state.account);
  const bitshares_fees = appStore((state) => state.bitshares_fees);
  const bitshares_testnet_fees = appStore((state) => state.bitshares_testnet_fees);
  const tusc_fees = appStore((state) => state.tusc_fees);

  let assetName = "";
  let relevantChain = "";
  let relevantFees;
  if (env === 'bitshares') {
    assetName = "BTS";
    relevantChain = 'BTS';
    relevantFees = bitshares_fees;
  } else if (env === 'bitshares_testnet') {
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    relevantFees = bitshares_testnet_fees;
  } else if (env === 'tusc') {
    assetName = "TUSC";
    relevantChain = 'TUSC';
    relevantFees = tusc_fees;
  }

  const currentChunkValue = chunk
    .map((z) => z.assignedTokens)
    .reduce((accumulator, ticket) => accumulator + ticket, 0);

  const ops = useMemo(() => {
    if (tokenDetails) {
      return chunk.map((x) => ({
        fee: {
          amount: 0,
          asset_id: "1.3.0",
        },
        from: account,
        to: x.id,
        amount: {
          amount: blockchainFloat(x.assignedTokens, tokenDetails.precision).toFixed(0),
          asset_id: tokenDetails.id,
        },
      }));
    }
    return [];
  }, [tokenDetails, account, chunk]);

  const [cardBytes, setCardBytes] = useState();
  useEffect(() => {
    async function checkTRXBytes() {
      let calculatedBytes;
      try {
        calculatedBytes = await window.electron.getTrxBytes(
          relevantFees.fee || 1,
          relevantChain,
          'transfer',
          ops
        );
      } catch (error) {
        console.log(error);
      }
      if (calculatedBytes) {
        setCardBytes(calculatedBytes);
      }
    }

    if (ops && ops.length > 0) {
      checkTRXBytes();
    }
  }, [ops]);

  return (
    <Card key={`airdrop_${chunkItr}`} mt="md" radius="md" padding="xl">
      <Text>
        {t("airdropCard:airdrop")} #
        {chunkItr + 1}
        /
        {winnerChunkQty}
      </Text>
      <Text fz="sm" c="dimmed">
        {`${chunk.length} ${t("airdropCard:accounts")} ${chunk.length > 1 ? `(${t("airdropCard:from")} ${chunk[0].id} ${t("airdropCard:to")} ${chunk[chunk.length - 1].id})` : ''}`}
        <br />
        { `${currentChunkValue.toFixed(tokenDetails.precision ?? 0)} ${tokenName || assetName} ${t("airdropCard:distro")}` }
        <br />
        {
          relevantFees && relevantFees.fee && relevantFees.maxBytes
            ? (
            <>
              {
                t("airdropCard:fees.nonLTM", {
                  nonLTM: parseFloat((chunk.length * relevantFees.fee).toFixed(5)),
                  assetName,
                })
              }
              <br />
              {
                t("airdropCard:fees.LTM", {
                  LTM: parseFloat((chunk.length * (relevantFees.fee * 0.2)).toFixed(5)),
                  assetName,
                })
              }
              <br />
              { cardBytes } / { relevantFees.maxBytes } bytes ({
                parseFloat((cardBytes / relevantFees.maxBytes) * 100).toFixed(2)
              } %)
            </>
            )
            : null
        }
      </Text>
      {
        !relevantFees || (relevantFees && cardBytes <= relevantFees.maxBytes)
          ? (
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
          )
          : (
            <Button disabled>
              {t("airdropCard:fees.tooBig")}
            </Button>
          )
      }

    </Card>
  );
}
