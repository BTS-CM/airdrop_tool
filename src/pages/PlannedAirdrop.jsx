import React, { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  SimpleGrid,
  Badge,
  Card,
  Button,
  Tooltip,
  Accordion,
  JsonInput,
} from '@mantine/core';

import { airdropStore, tempStore, beetStore } from '../lib/states';

export default function PlannedAirdrop(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const btsAirdrops = airdropStore((state) => state.bitshares);
  const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet);
  const tuscAirdrops = airdropStore((state) => state.tusc);
  const setAccount = tempStore((state) => state.setAccount);
  const reset = beetStore((state) => state.reset);

  useEffect(() => {
    setAccount();
    reset();
  }, []);

  let assetName = "";
  let chainName = "";
  let plannedAirdropData = {};
  if (params.env === 'bitshares') {
    plannedAirdropData = btsAirdrops.find((x) => params.id === x.id);
    chainName = "Bitshares";
    assetName = "BTS";
  } else if (params.env === 'bitshares_testnet') {
    plannedAirdropData = btsTestnetAirdrops.find((x) => params.id === x.id);
    chainName = "Bitshares (testnet)";
    assetName = "TEST";
  } else if (params.env === 'tusc') {
    plannedAirdropData = tuscAirdrops.find((x) => params.id === x.id);
    chainName = "TUSC";
    assetName = "TUSC";
  }

  const winners = plannedAirdropData.calculatedAirdrop.summary;
  const winnerAccordions = winners
    .sort((a, b) => b.qty - a.qty)
    .map((winner) => (
      <Accordion.Item key={`${winner.id}_acc`} value={`${winner.id}_acc`}>
        <Accordion.Control>
          &quot;
          <Link to={`/Account/${params.env}/${winner.id}`}>{winner.id}</Link>
          &quot;
          {
            winner.qty > 1
              ? t("plannedAirdrop:many", { qty: winner.qty })
              : t("plannedAirdrop:one")
          }
           (
          {
            parseFloat(winner.percent) > 1
              ? parseFloat(winner.percent).toFixed(2)
              : parseFloat(winner.percent).toFixed(5)
          }
          %)
        </Accordion.Control>
        <Accordion.Panel style={{ backgroundColor: '#FAFAFA' }}>
          <JsonInput
            label={t("plannedAirdrop:jsonLabel", {id: winner.id})}
            placeholder="Textarea will autosize to fit the content"
            defaultValue={JSON.stringify(winner.tickets)}
            validationError="Invalid JSON"
            formatOnBlur
            autosize
            minRows={4}
            maxRows={15}
          />
        </Accordion.Panel>
      </Accordion.Item>
    ));

  return (
    <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
      <Title order={2} ta="center" mt="sm">
        {t("plannedAirdrop:header.title", { chainName })}
        <br />
        <Link to={`/AirdropPrep/${params.env}/${params.id}`}>
          <Button compact>
            {t("plannedAirdrop:header.continue")}
          </Button>
        </Link>
        <Link to="/CalculatedAirdrops">
          <Button variant="outline" style={{ marginLeft: '10px' }} compact>
            {t("plannedAirdrop:header.back")}
          </Button>
        </Link>
      </Title>

      {
        !plannedAirdropData
          ? <Text>{t("plannedAirdrop:missingData")}</Text>
          : (
            <SimpleGrid cols={3} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("plannedAirdrop:details.id")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {plannedAirdropData.id}
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("plannedAirdrop:details.hash")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {plannedAirdropData.hash}
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("plannedAirdrop:details.dedupe")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {plannedAirdropData.deduplicate}
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("plannedAirdrop:details.onlyWins")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {plannedAirdropData.alwaysWinning}
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("plannedAirdrop:details.blockNum")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {plannedAirdropData.blockNumber}
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("plannedAirdrop:details.algos")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {
                    plannedAirdropData.algos.map((algo) => (
                      <Tooltip key={algo} label={`${plannedAirdropData.calculatedAirdrop.generatedNumbers[algo].length} tickets`}>
                        <Badge key={algo} style={{ margin: '1px' }}>{algo}</Badge>
                      </Tooltip>
                    ))
                  }
                </Text>
              </Card>
            </SimpleGrid>
          )
      }

      {
        !plannedAirdropData
          ? null
          : (
            <SimpleGrid cols={1} spacing="xl" mt={50}>
              <Card shadow="md" radius="md" padding="xl" style={{ wordWrap: 'break-word' }}>
                <Text fz="lg" fw={500} mt="md">
                  {t("plannedAirdrop:basis.witSig")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm" p="sm">
                  {
                      plannedAirdropData.witness_signature
                  }
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl" style={{ wordWrap: 'break-word' }}>
                <Text fz="lg" fw={500} mt="md">
                  {t("plannedAirdrop:basis.filtSig")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm" p="sm">
                  {
                      plannedAirdropData.filtered_signature
                  }
                </Text>
              </Card>
            </SimpleGrid>
          )
      }

      <Title order={4} pt="md" ta="left" mt="sm">
      {t("plannedAirdrop:winners")}
      </Title>
      <Accordion>
        {
          !plannedAirdropData
            ? null
            : winnerAccordions
        }
      </Accordion>

      {
        !plannedAirdropData
          ? null
          : (
            <SimpleGrid cols={1} spacing="xl" mt={50}>
              <Card shadow="md" radius="md" padding="xl">
                <JsonInput
                  label={t("plannedAirdrop:json")}
                  placeholder="Textarea will autosize to fit the content"
                  defaultValue={JSON.stringify(plannedAirdropData)}
                  validationError="Invalid JSON"
                  formatOnBlur
                  autosize
                  minRows={4}
                  maxRows={15}
                />
              </Card>
            </SimpleGrid>
          )
      }
    </Card>
  );
}
