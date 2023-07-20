/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeList as List } from 'react-window';
import { useDisclosure, usePagination } from '@mantine/hooks';

import {
  HiOutlineShieldExclamation,
  HiOutlineShieldCheck,
} from "react-icons/hi";

import {
  Text,
  Card,
  Button,
  Center,
  Pagination,
  Modal,
} from '@mantine/core';

import AirdropCard from './AirdropCard';

export default function AirdropCards(properties) {
  const { t } = useTranslation();

  const {
    winners,
    winnerChunks,
    finalBatchSize,
    batchSize,
    finalTokenName,
    tokenDetails,
    env,
  } = properties;

  // for accodion detail windows
  const [opened1, { open: open1, close: close1 }] = useDisclosure(false);

  const cachedAirdropCards = useMemo(() => winnerChunks.map((_, index) => (
      <AirdropCard
        key={`airdrop-card-${index}`}
        tokenName={finalTokenName}
        chunk={winnerChunks[index]}
        chunkItr={index}
        winnerChunkQty={winnerChunks.length}
        env={env}
        tokenDetails={tokenDetails}
      />
  )), [finalTokenName, winnerChunks, env, tokenDetails]);

  //const [page, onChange] = useState(1);
  //const pagination = usePagination({ total: 10, page, onChange });
  const [activePage, setPage] = useState(1);

  return (
    <>
      <Card shadow="md" radius="md" padding="sm" style={{ backgroundColor: '#FAFAFA' }}>
        <Text fz="lg" fw={500} mt="md">
          <HiOutlineShieldCheck />
          {' '}
          {t("customAirdrop:grid.right.valid.title")}
        </Text>
        <Text fz="sm" c="dimmed" mt="xs">
          {
            winners.length / finalBatchSize < 1
              ? t("customAirdrop:grid.right.valid.single", { batchSize })
              : t("customAirdrop:grid.right.valid.multi", { batchSize, qtyBatches: Math.ceil(winners.length / finalBatchSize) })
          }
        </Text>
        <Text fz="sm" c="dimmed" mt="xs">
          {t("customAirdrop:grid.right.valid.reminder")}
        </Text>
        {
          opened1
            ? (
              <Button disabled style={{ marginTop: '20px' }}>
                {t("performAirdrop:grid.left.modals.opening")}
              </Button>
            )
            : (
              <Button style={{ marginTop: '20px' }} onClick={open1}>
                {t("performAirdrop:grid.left.modals.btn1")}
              </Button>
            )
        }
      </Card>
      <Modal
        opened={opened1}
        onClose={() => {
          close1();
        }}
        size="lg"
        title={t("performAirdrop:grid.left.table.title")}
        overlayProps={{
          opacity: 0.35,
          blur: 1.5,
        }}
      >
        {
          cachedAirdropCards[activePage - 1]
        }
        <br />
        <Center>
          <Pagination value={activePage} onChange={setPage} total={cachedAirdropCards.length} />
        </Center>
      </Modal>
    </>
  );
}
