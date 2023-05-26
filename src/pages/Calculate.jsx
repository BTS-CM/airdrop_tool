import React, { useState } from 'react';
import { Link } from "wouter";

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
    Checkbox,
    Group,
    TextInput
} from '@mantine/core';
import { appStore, ticketStore, leaderboardStore } from '../lib/states';

export default function Calculate(properties) {
    const btsLeaderboard = leaderboardStore((state) => state.bitshares)
    const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet)
    const tuscLeaderboard = leaderboardStore((state) => state.tusc)

    const [value, setValue] = useState('bitshares');
    const [hash, setHash] = useState('plain');
    const [winners, setWinners] = useState('y_remove');
    const [blockNumber, onBlockNumber] = useState(1000);
    const [selection, setSelection] = useState(['1']);

    const [progress, setProgress] = useState('planning'); // planning, calculating, completed

    let calculationTypes = [
        { name: 'Forward chunks', value: 'forward', desc: 'Split hash into ticket numbers.' },
        { name: 'Reverse chunks', value: 'reverse', desc: 'Reverse hash then split into ticket numbers.' },
        { name: 'PI', value: 'pi', desc: 'Split hash, do some math then multiply by PI for ticket numbers.' },
        { name: 'Reverse PI', value: 'reverse_pi', desc: 'Split hash, reverse hash chunks, do math, multiply by PI, output tickets.' },
        { name: 'Cubed', value: 'cubed', desc: 'Split hash into 3 digit chunks, cube each chunk, output tickets.' },
        { name: 'Bouncing ball', value: 'bouncing_ball', desc: 'path of ball bouncing in matrix -> pick tickets along path' },
        { name: 'Alien blood', value: 'alien_blood', desc: 'Picks alien blood splatter spots; it burns directly down through the hull' },
        { name: 'Average point lines', value: 'avg_point_lines', desc: 'Calculate the avg x/y/z coordinates -> draw lines to this from each vector => reward those on line' }
    ];

    const toggleRow = (id) => setSelection((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

    let assetName = "1.3.0";
    let leaderboardJSON = [];
    if (value === 'bitshares') {
        leaderboardJSON = btsLeaderboard;
        assetName = "BTS";
    } else if (value === 'bitshares_testnet') {
        leaderboardJSON = btsTestnetLeaderboard;
        assetName = "TEST";
    } else if (value === 'tusc') {
        leaderboardJSON = tuscLeaderboard;
        assetName = "TUSC"
    }

    let ticketJSON = {
        bitshares: [{
            id: "1.18.0",
            account: "1.2.12376",
            target_type: "lock_720_days",
            amount: {
                "amount": "10000000000",
                "asset_id": "1.3.0"
            },
            current_type: "lock_720_days",
            status: "stable",
            value: "80000000000",
            next_auto_update_time: "2106-02-07T06:28:15",
            next_type_downgrade_time: "2106-02-07T06:28:15"
        }],
        bitshares_testnet: [],
        tusc: []
    };

    /*
        {
            type: 'select',
            name: 'winners',
            message: 'Should drawn tickets always have winners?',
            choices: [
                { title: 'Yes, remove unallocated tickets from draw.', value: 'y_remove' },
                { title: 'No, only allocate tickets if rightfully won.', value: 'no' }
            ],
        },
    */

    const rows = calculationTypes.map((item) => {
        const selected = selection.includes(item.value);
        return (
            <tr key={item.value}>
                <td>
                    <Checkbox
                        checked={selection.includes(item.value)}
                        onChange={() => toggleRow(item.value)}
                        transitionDuration={0}
                    />
                </td>
                <td>
                    <Group spacing="sm">
                        <Text size="sm" weight={500}>
                            {item.name}
                        </Text>
                    </Group>
                </td>
                <td>
                    {item.desc}
                </td>
            </tr>
        );
    });

    function performCalculation() {
        setProgress('calculating');
        // perform calculation
        setProgress('completed');
    }

    if (progress === 'calculating') {
        return (<>
            <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Title order={4} ta="left" mt="xs">
                    Performing airdrop calculations, please wait!
                </Title>
            </Card>
        </>)
    }

    if (progress === 'completed') {
        return (<>
            <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Title order={4} ta="left" mt="xs">
                    Successfully completed airdrop calculations!
                </Title>
                <Button onClick={() => setProgress('planning')}>
                    Calculate another airdrop?
                </Button>
            </Card>
        </>)
    }
    
    return (<>
        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Title order={4} ta="left" mt="xs">
                Calculate a provably fair airdrop distribution for which blockchain?
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
            !ticketJSON[value] || !ticketJSON[value].length
            ? null
            : <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Title order={4} ta="left" mt="xs">
                    What kind of blockhash do you want to use for initial provably random input?
                </Title>
                <Radio.Group
                    value={hash}
                    onChange={setHash}
                    name="chosenHash"
                    label="Select an initial hash type"
                    description="Original, or securely hashed?"
                    withAsterisk
                >
                    <Group mt="xs">
                        <Radio value="plain" label="Plain witness signature string" />
                        <Radio value="Blake2B" label="Blake2B (512 bit) hash of witness signature" />
                        <Radio value="Blake2S" label="Blake2S (256 bit) hash of witness signature" />
                    </Group>
                </Radio.Group>
            </Card>
        }

        {
            !ticketJSON[value] || !ticketJSON[value].length
            ? null
            : <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Title order={4} ta="left" mt="xs">
                    Enter the block number you wish to use for airdrop purposes
                </Title>
                <TextInput
                    type="number"
                    placeholder={blockNumber}
                    label="Block number"
                    style={{maxWidth:'250px'}}
                    onChange={(event) => onBlockNumber(event.currentTarget.value)}
                />
            </Card>
        }

        {
            !ticketJSON[value] || !ticketJSON[value].length
            ?   <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                    <Title order={3} ta="center" mt="sm">
                        You must fetch the ticket data for this blockchain.
                    </Title>
                </Card>
            :   <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                    <Title order={4} ta="left" mt="xs">
                        Select your prefered method(s) for generating provably fair airdrop distributions
                    </Title>
                    <ScrollArea>
                        <Table miw={800} verticalSpacing="sm">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                    </th>
                                    <th>Type</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>{rows}</tbody>
                        </Table>
                    </ScrollArea>
                </Card>
        }

        {
            !ticketJSON[value] || !ticketJSON[value].length
            ? null
            : <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Title order={4} ta="left" mt="xs">
                    Proceed with airdrop calculation
                </Title>
                <Text>
                    Your calculated airdrop vector will be made available in the airdrop page once completed.
                </Text>
                <Button style={{marginTop:'10px'}} onClick={() => performCalculation()}>
                    Perform airdrop calculation
                </Button>
            </Card>
        }


    </>);
}