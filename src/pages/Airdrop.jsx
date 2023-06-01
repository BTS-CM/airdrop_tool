import React, { useState } from 'react';

import {
  Title,
  Text,
  SimpleGrid,
  Badge,
  Card,
  Radio,
  Table,
  Button,
  ScrollArea,
  Group,
} from '@mantine/core';

export default function Airdrop(properties) {
  const [value, setValue] = useState('bitshares');

  const airdropJSON = [{
    id: "1.2.98546",
    tickets: "[211191944,211464739,211834929,211965423,212040679]",
    qty: 5,
    percent: "0.17403",
    reward: "0.77269",
  }];

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          Perform a provably fair airdrop
        </Title>
        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label="Select the target blockchain"
          description="Graphene based blockchains only"
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
            !airdropJSON || !airdropJSON.length
              ? (
                <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
                  <Title order={3} ta="center" mt="sm">
                    You must calculate an airdrop for the chosen blockchain
                  </Title>
                </Card>
              )
              : (
                <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
                  <Title order={4} ta="center" mt="xs">
                    Select the airdrop to perform
                  </Title>
                </Card>
              )
        }
    </>
  );
}
