import React, { useState } from 'react';

import {
    Title,
    Text,
    SimpleGrid,
    TextInput,
    Card,
    Radio,
    Table,
    Button,
    Group,
    Badge
} from '@mantine/core';
import { leaderboardStore } from '../lib/states';

export default function Create(properties) {
    const [value, setValue] = useState('bitshares');
    const [ticketType, setTicketType] = useState("lock_180_days");
    const [tokenQuantity, onTokenQuantity] = useState(1);


    const btsLeaderboard = leaderboardStore((state) => state.bitshares)
    const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet)
    const tuscLeaderboard = leaderboardStore((state) => state.tusc)

    let assetName = "1.3.0";
    let leaderboardJSON = [];
    let currentlyLocked = 0;
    if (value === 'bitshares') {
        leaderboardJSON = btsLeaderboard;
        currentlyLocked = btsLeaderboard.reduce((accumulator, entry) => accumulator + parseInt(entry.amount), 0);
        assetName = "BTS";
    } else if (value === 'bitshares_testnet') {
        leaderboardJSON = btsTestnetLeaderboard;
        currentlyLocked = btsTestnetLeaderboard.reduce((accumulator, entry) => accumulator + parseInt(entry.amount), 0);
        assetName = "TEST";
    } else if (value === 'tusc') {
        leaderboardJSON = tuscLeaderboard;
        currentlyLocked = tuscLeaderboard.reduce((accumulator, entry) => accumulator + parseInt(entry.amount), 0);
        assetName = "TUSC"
    }

    let tokenLockValue = 0;
    if (ticketType === "lock_180_days") {
        tokenLockValue = tokenQuantity * 2;
    } else if (ticketType === "lock_360_days") {
        tokenLockValue = tokenQuantity * 4;
    } else if (ticketType === "lock_720_days") {
        tokenLockValue = tokenQuantity * 8;
    } else {
        tokenLockValue = tokenQuantity * 8;
    }

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
                value={ticketType}
                onChange={setTicketType}
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

            <TextInput
                type="number"
                placeholder={tokenQuantity}
                label={`Enter the quantity of ${assetName} you wish to lock`}
                style={{maxWidth:'300px', marginTop: '20px'}}
                onChange={(event) => onTokenQuantity(event.currentTarget.value)}
            />

            <Text fz="md" style={{marginTop: '15px'}}>
                By locking {tokenQuantity} {assetName} your ticket will be equivalent to {tokenLockValue} {assetName} in terms of voting and airdrop surface area.
            </Text>

            <Button style={{marginTop:'20px'}}>
                Ask BEET to create ticket
            </Button>
        </Card>

        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Title order={5} ta="center" mt="xs">
                As a result of creating this ticket, the top 10 leaderboard stats will change as such
            </Title>
            <Table miw={800} verticalSpacing="sm" mt="md">
                <thead>
                    <th align='left'>ID</th>
                    <th align='left'>Amount</th>
                    <th align='left'>Before</th>
                    <th align='left'>After</th>
                </thead>
                <tbody>
                    {
                        leaderboardJSON.slice(0, 10).map(leader => {
                            return <tr>
                                        <td>{leader.id}</td>
                                        <td>{leader.amount}</td>
                                        <td>{leader.percent.toFixed(2)} %</td>
                                        <td>{((leader.amount/(currentlyLocked + tokenLockValue))*100).toFixed(2)} %</td>
                                    </tr>
                        })
                    }
                </tbody>
            </Table>
        </Card>


    </>;
}