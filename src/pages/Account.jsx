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
  ActionIcon,
} from '@mantine/core';
import { HiOutlineChartPie } from "react-icons/hi";

import { Link, useParams } from "react-router-dom";
import { appStore, ticketStore } from '../lib/states';

function humanReadableFloat(satoshis, precision) {
  return satoshis / 10 ** precision;
}

export default function Account(properties) {
  const params = useParams();
  
  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet);
  const tuscTickets = ticketStore((state) => state.tusc);

  let assetName = "";
  let chainName = "";
  let targetJSON = [];
  if (params.env === 'bitshares') {
    targetJSON = btsTickets;
    assetName = "BTS";
    chainName = "Bitshares";
  } else if (params.env === 'bitshares_testnet') {
    targetJSON = btsTestnetTickets;
    assetName = "TEST";
    chainName = "Bitshares (Testnet)";
  } else if (params.env === 'tusc') {
    targetJSON = tuscTickets;
    assetName = "TUSC";
    chainName = "TUSC";
  }

  const retrievedAccountTickets = targetJSON.filter((x) => x.account === params.id);

  const ids = [];
  const tableRows = retrievedAccountTickets.map((ticket) => (
    <tr key={ticket.id}>
      <td>
        <Link to={`/Ticket/${params.env}/${ticket.id}`} style={{ textDecoration: 'none' }}>
          {ticket.id}
        </Link>
      </td>
      <td>
        {ticket.account}
      </td>
      <td>{ticket.current_type}</td>
      <td>{ticket.target_type}</td>
      <td>
        {
                            ticket.amount.amount > 1
                              ? parseFloat(humanReadableFloat(ticket.amount.amount, 5).toFixed(5))
                              : ticket.amount.amount
                        }
        {' '}
        {assetName}
      </td>
      <td>{ticket.status}</td>
      <td>
        {
                            ticket.value > 1
                              ? parseFloat(humanReadableFloat(ticket.value, 5).toFixed(5))
                              : ticket.value
                        }
        {' '}
        {assetName}
      </td>
      <td>{ticket.next_auto_update_time}</td>
      <td>{ticket.next_type_downgrade_time}</td>
    </tr>
  ));

  const validTickets = retrievedAccountTickets.map((ticket) => {
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

  const lockedQuantity = humanReadableFloat(
    validTickets
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const smallLocked = humanReadableFloat(
    smallLock
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const medLocked = humanReadableFloat(
    medLock
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const lgLocked = humanReadableFloat(
    lgLock
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const xlLocked = humanReadableFloat(
    xlLock
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const boostedValue = humanReadableFloat(
    validTickets
      .map((ticket) => parseInt(ticket.value, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  return (
    <>
      <SimpleGrid cols={4} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
        <Card shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            {assetName}
            {' '}
            locked
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {lockedQuantity}
          </Text>
        </Card>
        <Card shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            {assetName}
            {' '}
            ticket values
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {boostedValue}
          </Text>
        </Card>
        <Card shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            Total created tickets
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {retrievedAccountTickets.length}
          </Text>
        </Card>
        <Card shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            Active tickets
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {validTickets.length}
          </Text>
        </Card>

        <Card shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            Locked for 180 days
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {smallLock.length}
            {' '}
            tickets (
            {validTickets.length ? ((smallLock.length / validTickets.length) * 100).toFixed(2) : 0}
            {' '}
            %)
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {smallLocked}
            {' '}
            {assetName}
            {' '}
            locked (
            {lockedQuantity ? ((smallLocked / lockedQuantity) * 100).toFixed(2) : 0}
            {' '}
            %)
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {smallLocked * 2}
            {' '}
            {assetName}
            {' '}
            vote weight
          </Text>
          <Text fz="xs" c="dimmed" mt="sm">
            200% vote multiplier
          </Text>
        </Card>
        <Card shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            Locked for 360 days
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {medLock.length}
            {' '}
            tickets (
            {validTickets.length ? ((medLock.length / validTickets.length) * 100).toFixed(2) : 0}
            {' '}
            %)
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {medLocked}
            {' '}
            {assetName}
            {' '}
            locked (
            {lockedQuantity ? ((medLocked / lockedQuantity) * 100).toFixed(2) : 0}
            {' '}
            %)
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {medLocked * 4}
            {' '}
            {assetName}
            {' '}
            vote weight
          </Text>
          <Text fz="xs" c="dimmed" mt="sm">
            400% vote multiplier
          </Text>
        </Card>
        <Card shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            Locked for 720 days
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {lgLock.length}
            {' '}
            tickets (
            {validTickets.length ? ((lgLock.length / validTickets.length) * 100).toFixed(2) : 0}
            {' '}
            %)
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {lgLocked}
            {' '}
            {assetName}
            {' '}
            locked (
            {lockedQuantity ? ((lgLocked / lockedQuantity) * 100).toFixed(2) : 0}
            {' '}
            %)
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {lgLocked * 8}
            {' '}
            {assetName}
            {' '}
            vote weight
          </Text>
          <Text fz="xs" c="dimmed" mt="sm">
            800% vote multiplier
          </Text>
        </Card>
        <Card shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            Locked forever
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {xlLock.length}
            {' '}
            tickets (
            {validTickets.length ? ((xlLock.length / validTickets.length) * 100).toFixed(2) : 0}
            {' '}
            %)
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {xlLocked}
            {' '}
            {assetName}
            {' '}
            locked (
            {lockedQuantity ? ((xlLocked / lockedQuantity) * 100).toFixed(2) : 0}
            {' '}
            %)
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
            {xlLocked * 8}
            {' '}
            {assetName}
            {' '}
            vote weight
          </Text>
          <Text fz="xs" c="dimmed" mt="sm">
            800% vote multiplier
          </Text>
        </Card>
      </SimpleGrid>

      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Table>
          <thead>
            <tr>
              <th>id</th>
              <th>account</th>
              <th>current type</th>
              <th>target type</th>
              <th>amount</th>
              <th>current status</th>
              <th>value</th>
              <th>next update time</th>
              <th>next downgrade time</th>
            </tr>
          </thead>
          <tbody>
            {tableRows}
          </tbody>
        </Table>
      </Card>

      <SimpleGrid cols={1} spacing="xl" mt={50} ml={75} mr={75}>
        <Card ta="center" shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            <HiOutlineChartPie />
            {' '}
            Want to gain influence and improve your airdrop odds?
          </Text>
          <Text fz="sm" c="dimmed" m="sm">
            Create another ticket on the
            {' '}
            {chainName}
            {' '}
            blockchain
          </Text>
          <Link to={`/Create/${params.env}/${params.id}`}>
            <Button m="sm">
              Create new ticket
            </Button>
          </Link>
        </Card>
      </SimpleGrid>
    </>
  );
}
