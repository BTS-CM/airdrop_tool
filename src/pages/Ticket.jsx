/* eslint-disable react/jsx-no-useless-fragment */
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
import { Link, useParams } from "react-router-dom";

import { appStore, ticketStore } from '../lib/states';

export default function Ticket(properties) {
  const params = useParams();

  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet);
  const tuscTickets = ticketStore((state) => state.tusc);

  let assetName = "";
  let targetJSON = [];
  if (params.env === 'bitshares') {
    targetJSON = btsTickets;
    assetName = "BTS";
  } else if (params.env === 'bitshares_testnet') {
    targetJSON = btsTestnetTickets;
    assetName = "TEST";
  } else if (params.env === 'tusc') {
    targetJSON = tuscTickets;
    assetName = "TUSC";
  }

  const retrievedTicket = targetJSON.filter((x) => x.id === params.id);

  return (
    <>
      {
            !retrievedTicket.length
              ? <Text>Ticket not found</Text>
              : (
                <SimpleGrid cols={3} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      Ticket ID
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {retrievedTicket[0].id}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      Ticket owner
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      <Link to={`/Account/${params.env}/${retrievedTicket[0].account}`} style={{ textDecoration: 'none' }}>
                        {retrievedTicket[0].account}
                      </Link>
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      Current ticket type
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {retrievedTicket[0].current_type}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      Target ticket type
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {retrievedTicket[0].target_type}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {assetName}
                      {' '}
                      stored in ticket
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {
                                retrievedTicket[0].amount.amount > 1
                                  ? (retrievedTicket[0].amount.amount / 100000).toFixed(0)
                                  : retrievedTicket[0].amount.amount
                            }
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      {assetName}
                      {' '}
                      ticket value
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {
                                retrievedTicket[0].value > 1
                                  ? (retrievedTicket[0].value / 100000).toFixed(0)
                                  : retrievedTicket[0].value
                            }
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      Current ticket status
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {
                                retrievedTicket[0].status
                            }
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      Next auto update time
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {
                                retrievedTicket[0].next_auto_update_time
                            }
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="md">
                      Next auto downgrade time
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                      {
                                retrievedTicket[0].next_type_downgrade_time
                            }
                    </Text>
                  </Card>
                </SimpleGrid>
              )
        }
    </>
  );
}
