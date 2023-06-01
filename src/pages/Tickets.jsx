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
  JsonInput,
} from '@mantine/core';
import { appStore, ticketStore } from '../lib/states';

export default function Tickets(properties) {
  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet);
  const tuscTickets = ticketStore((state) => state.tusc);

  let targetJSON = [];
  if (properties.params.env === 'bitshares') {
    targetJSON = btsTickets;
  } else if (properties.params.env === 'bitshares_testnet') {
    targetJSON = btsTestnetTickets;
  } else if (properties.params.env === 'tusc') {
    targetJSON = tuscTickets;
  }

  const label = `${properties.params.env} JSON`;
  return (
    <Card shadow="md" radius="md" padding="xl">
      <Title order={2} ta="center" mt="sm">
        Ticket JSON
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
