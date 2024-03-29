/* eslint-disable react/jsx-no-useless-fragment */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Text,
  SimpleGrid,
  Card,
} from '@mantine/core';
import { Link, useParams } from "react-router-dom";

import { appStore, ticketStore } from '../lib/states';

export default function Ticket(properties) {
  const { t, i18n } = useTranslation();
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
          ? <Text>{t("ticket:none")}</Text>
          : (
            <SimpleGrid cols={3} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("ticket:id")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {retrievedTicket[0].id}
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("ticket:owner")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  <Link to={`/Account/${params.env}/${retrievedTicket[0].account}`} style={{ textDecoration: 'none' }}>
                    {retrievedTicket[0].account}
                  </Link>
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("ticket:currentType")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {retrievedTicket[0].current_type}
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("ticket:targetType")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {retrievedTicket[0].target_type}
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("ticket:storedTickets", { assetName })}
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
                  {t("ticket:ticketValue", { assetName })}
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
                  {t("ticket:currentStatus")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {
                    retrievedTicket[0].status
                  }
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("ticket:nextUpgrade")}
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                  {
                    retrievedTicket[0].next_auto_update_time
                  }
                </Text>
              </Card>
              <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                  {t("ticket:nextDowngrade")}
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
