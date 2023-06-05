import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  Title,
  Text,
  SimpleGrid,
  Badge,
  ActionIcon,
  Card,
  Radio,
  Table,
  Button,
  ScrollArea,
  Group,
} from '@mantine/core';

import { airdropStore } from '../lib/states';

export default function CalculatedAirdrops(properties) {
  const { t, i18n } = useTranslation();
  const btsAirdrops = airdropStore((state) => state.bitshares);
  const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet);
  const tuscAirdrops = airdropStore((state) => state.tusc);

  const eraseOne = airdropStore((state) => state.eraseOne);

  const [value, setValue] = useState('bitshares');

  let chosenAirdropData = [];
  if (value === 'bitshares') {
    chosenAirdropData = btsAirdrops;
  } else if (value === 'bitshares_testnet') {
    chosenAirdropData = btsTestnetAirdrops;
  } else if (value === 'tusc') {
    chosenAirdropData = tuscAirdrops;
  }

  const tableRows = chosenAirdropData && chosenAirdropData.length
    ? chosenAirdropData.map((airdrop) => (
      <tr key={airdrop.id}>
        <td>
          <Link to={`/PlannedAirdrop/${value}/${airdrop.id}`}>
            <Button compact style={{ margin: '1px' }}>
              {airdrop.id.slice(0, 8)}
              ...
            </Button>
          </Link>
        </td>
        <td>{airdrop.hash}</td>
        <td>{airdrop.blockNumber}</td>
        <td>{airdrop.calculatedAirdrop.summary.length}</td>
        <td>{airdrop.algos.length}</td>
        <td>{airdrop.deduplicate}</td>
        <td>{airdrop.alwaysWinning}</td>
        <td>
          <ActionIcon onClick={() => {
            eraseOne(value, airdrop.id);
          }}
          >
            ❌
          </ActionIcon>
        </td>
      </tr>
    ))
    : null;

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          {t("calculatedAirdrops:title")}
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label={t("calculatedAirdrops:radioLbl")}
          description={t("calculatedAirdrops:radioDesc")}
          withAsterisk
        >
          <Group mt="xs">
            <Radio value="bitshares" label="Bitshares" />
            <Radio value="bitshares_testnet" label="Bitshares (Testnet)" />
            <Radio value="tusc" label="TUSC" />
          </Group>
        </Radio.Group>
      </Card>

      {
        !tableRows || !tableRows.length
          ? (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Title order={4} ta="center" mt="sm">
                {t("calculatedAirdrops:none.title")}
                <br />
                <Link to="/Calculate">
                  <Button mt="sm">
                    {t("calculatedAirdrops:none.btn")}
                  </Button>
                </Link>
              </Title>
            </Card>
          )
          : (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Table>
                <thead>
                  <tr>
                    <th>{t("calculatedAirdrops:table.th1")}</th>
                    <th>{t("calculatedAirdrops:table.th2")}</th>
                    <th>{t("calculatedAirdrops:table.th3")}</th>
                    <th>{t("calculatedAirdrops:table.th4")}</th>
                    <th>{t("calculatedAirdrops:table.th5")}</th>
                    <th>{t("calculatedAirdrops:table.th6")}</th>
                    <th>{t("calculatedAirdrops:table.th7")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows}
                </tbody>
              </Table>
            </Card>
          )
      }
    </>
  );
}
