import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Title,
  Text,
  SimpleGrid,
  Card,
  Radio,
  Table,
  Button,
  Group,
  JsonInput,
} from '@mantine/core';
import { useParams } from 'react-router-dom';
import { appStore, ticketStore } from '../lib/states';

export default function Tickets(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet);
  const tuscTickets = ticketStore((state) => state.tusc);

  let targetJSON = [];
  if (params.env === 'bitshares') {
    targetJSON = btsTickets;
  } else if (params.env === 'bitshares_testnet') {
    targetJSON = btsTestnetTickets;
  } else if (params.env === 'tusc') {
    targetJSON = tuscTickets;
  }

  const label = `${params.env} JSON`;
  return (
    <Card shadow="md" radius="md" padding="xl">
      <Title order={2} ta="center" mt="sm">
        {t("tickets:json")}
      </Title>

      <JsonInput
        label={label}
        placeholder="Textarea will autosize to fit the content"
        defaultValue={JSON.stringify(targetJSON)}
        validationError="Invalid JSON"
        formatOnBlur
        autosize
        minRows={4}
        maxRows={15}
      />
    </Card>
  );
}
