import React, { useState } from 'react';

import {
    Title,
    Text,
    SimpleGrid,
    Card,
    Radio,
    Table,
    Button,
    Group
} from '@mantine/core';

export default function Create(properties) {
    const [value, setValue] = useState('bitshares');

    return <>
        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Title order={2} ta="center" mt="sm">
                Create a Ticket
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

            <Radio.Group
                value={value}
                onChange={setValue}
                name="lockType"
                label="Select your desired ticket type"
                description="Longer lock durations grants greater voting weight."
                style={{marginTop:'20px'}}
                withAsterisk
            >
                <Group mt="xs">
                    <Radio value="lock_180_days" label="Lock for 180 days (200% boost)" />
                    <Radio value="lock_360_days" label="Lock for 360 days (400% boost)" />
                    <Radio value="lock_720_days" label="Lock for 720 days (800% boost)" />
                    <Radio value="lock_forever" label="Lock forever (800% boost)" />
                </Group>
            </Radio.Group>

            <Text fz="md" c="dimmed" mt="sm" style={{marginTop:'20px'}}>
                Note: This feature interfaces with the BEET multiwallet.
            </Text>

            <Button style={{marginTop:'20px'}}>
                Submit
            </Button>
        </Card>
    </>;
}