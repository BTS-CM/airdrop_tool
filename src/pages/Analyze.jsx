import React, { useState } from 'react';
import {
  Title,
  Text,
  SimpleGrid,
  Card,
  Radio,
  Table,
  Button,
  Group,
  ScrollArea,
  ActionIcon,
} from '@mantine/core';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { appStore, ticketStore } from '../lib/states';
import { humanReadableFloat } from '../lib/common';

export default function Analyze(properties) {
  const { t, i18n } = useTranslation();
  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet);
  const tuscTickets = ticketStore((state) => state.tusc);
  const [value, setValue] = useState('bitshares');

  let assetName = "1.3.0";
  let targetJSON = [];
  if (value === 'bitshares') {
    targetJSON = btsTickets;
    assetName = "BTS";
  } else if (value === 'bitshares_testnet') {
    targetJSON = btsTestnetTickets;
    assetName = "TEST";
  } else if (value === 'tusc') {
    targetJSON = tuscTickets;
    assetName = "TUSC";
  }

  const tableRows = targetJSON.map((ticket) => (
    <tr key={ticket.id}>
      <td>
        <Link to={`/Ticket/${value}/${ticket.id}`} style={{ textDecoration: 'none' }}>
          {ticket.id}
        </Link>
      </td>
      <td>
        <Link to={`/Account/${value}/${ticket.account}`} style={{ textDecoration: 'none' }}>
          {ticket.account}
        </Link>
      </td>
      <td>{ticket.current_type}</td>
      <td>{ticket.target_type}</td>
      <td>
        { parseFloat(humanReadableFloat(ticket.amount.amount, 5).toFixed(5)) }
        {' '}
        {assetName}
      </td>
      <td>{ticket.status}</td>
      <td>
        { parseFloat(humanReadableFloat(ticket.value, 5).toFixed(5)) }
        {' '}
        {assetName}
      </td>
      <td>{ticket.next_auto_update_time}</td>
      <td>{ticket.next_type_downgrade_time}</td>
    </tr>
  ));

  const validTickets = targetJSON.map((ticket) => {
    if (ticket.current_type !== "liquid") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const smallLock = validTickets.map((ticket) => {
    if (ticket.current_type === "lock_180_days") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const medLock = validTickets.map((ticket) => {
    if (ticket.current_type === "lock_360_days") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const lgLock = validTickets.map((ticket) => {
    if (ticket.current_type === "lock_720_days") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const xlLock = validTickets.map((ticket) => {
    if (ticket.current_type === "lock_forever") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const lockedQuantity = (validTickets.reduce(
    (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount, 10),
    0,
  ) / 10000).toFixed(0);

  const smallLocked = (smallLock.reduce(
    (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount, 10),
    0,
  ) / 10000).toFixed(0);

  const medLocked = (medLock.reduce(
    (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount, 10),
    0,
  ) / 10000).toFixed(0);

  const lgLocked = (lgLock.reduce(
    (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount, 10),
    0,
  ) / 10000).toFixed(0);

  const xlLocked = (xlLock.reduce(
    (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount, 10),
    0,
  ) / 10000).toFixed(0);

  const boostedValue = (validTickets.reduce(
    (accumulator, ticket) => accumulator + parseInt(ticket.value, 10),
    0,
  ) / 10000).toFixed(0);

  let uniqueCount = 0;
  const uniqueIDs = [];
  for (let x = 0; x < validTickets.length; x++) {
    if (!uniqueIDs.includes(validTickets[x].account)) {
      uniqueCount += 1;
      uniqueIDs.push(validTickets[x].account);
    }
  }

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          {t("analyze:title")}
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label={t("analyze:radioLabel")}
          description={t("analyze:radioDesc")}
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
              ? null
              : (
                <SimpleGrid cols={4} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {assetName}
                      {' '}
                      {t("analyze:locked")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {lockedQuantity}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {assetName}
                      {' '}
                      {t("analyze:boosted")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {boostedValue}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {t("analyze:unique")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {uniqueCount}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {t("analyze:active")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {validTickets.length}
                    </Text>
                  </Card>

                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {t("analyze:smLock")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {smallLock.length}
                      {' '}
                      {t("analyze:tickets")} (
                      {((smallLock.length / uniqueCount) * 100).toFixed(2)}
                      {' '}
                      %)
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {smallLocked}
                      {' '}
                      {assetName}
                      {' '}
                      (
                      {((smallLocked / lockedQuantity) * 100).toFixed(2)}
                      {' '}
                      %)
                    </Text>
                    <Text fz="xs" c="dimmed" mt="sm">
                      {t("analyze:smMulti")}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {t("analyze:mdLock")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {medLock.length}
                      {' '}
                      {t("analyze:tickets")} (
                      {((medLock.length / uniqueCount) * 100).toFixed(2)}
                      {' '}
                      %)
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {medLocked}
                      {' '}
                      {assetName}
                      {' '}
                      (
                      {((medLocked / lockedQuantity) * 100).toFixed(2)}
                      {' '}
                      %)
                    </Text>
                    <Text fz="xs" c="dimmed" mt="sm">
                      {t("analyze:mdMulti")}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {t("analyze:lgLock")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {lgLock.length}
                      {' '}
                      {t("analyze:tickets")} (
                      {((lgLock.length / uniqueCount) * 100).toFixed(2)}
                      {' '}
                      %)
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {lgLocked}
                      {' '}
                      {assetName}
                      {' '}
                      (
                      {((lgLocked / lockedQuantity) * 100).toFixed(2)}
                      {' '}
                      %)
                    </Text>
                    <Text fz="xs" c="dimmed" mt="sm">
                      {t("analyze:lgMulti")}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {t("analyze:xlLock")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {xlLock.length}
                      {' '}
                      {t("analyze:tickets")} (
                      {((xlLock.length / uniqueCount) * 100).toFixed(2)}
                      {' '}
                      %)
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {xlLocked}
                      {' '}
                      {assetName}
                      {' '}
                      (
                      {((xlLocked / lockedQuantity) * 100).toFixed(2)}
                      {' '}
                      %)
                    </Text>
                    <Text fz="xs" c="dimmed" mt="sm">
                      {t("analyze:xlMulti")}
                    </Text>
                  </Card>
                </SimpleGrid>
              )
        }

      {
            !tableRows || !tableRows.length
              ? (
                <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
                  <Title order={3} ta="center" mt="sm">
                    {t("analyze:fetchTickets")}
                  </Title>
                </Card>
              )
              : (
                <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
                  <Table highlightOnHover>
                    <thead>
                      <tr>
                        <th>{t("analyze:th1")}</th>
                        <th>{t("analyze:th2")}</th>
                        <th>{t("analyze:th3")}</th>
                        <th>{t("analyze:th4")}</th>
                        <th>{t("analyze:th5")}</th>
                        <th>{t("analyze:th6")}</th>
                        <th>{t("analyze:th7")}</th>
                        <th>{t("analyze:th8")}</th>
                        <th>{t("analyze:th9")}</th>
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
