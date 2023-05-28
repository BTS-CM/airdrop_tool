import React, { useEffect, useState } from 'react';
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
    Group,
    Tooltip,
    Accordion,
    JsonInput,
    TextInput
} from '@mantine/core';

import { airdropStore } from '../lib/states';

export default function PerformAirdrop(properties) {
    const btsAirdrops = airdropStore((state) => state.bitshares)
    const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet)
    const tuscAirdrops = airdropStore((state) => state.tusc)
    const [tokenQuantity, onTokenQuantity] = useState(1);
    const [tokenName, onTokenName] = useState("")
    const [distroMethod, setDistroMethod] = useState("Proportionally");
    
    let assetName = "";
    let titleName = "token";

    let plannedAirdropData = {};
    if (properties.params.env === 'bitshares') {
        plannedAirdropData = btsAirdrops.find(x => properties.params.id === x.id);
        assetName = "BTS";
        titleName = "Bitshares";
    } else if (properties.params.env === 'bitshares_testnet') {
        plannedAirdropData = btsTestnetAirdrops.find(x => properties.params.id === x.id);
        assetName = "TEST";
        titleName = "Bitshares (Testnet)";
    } else if (properties.params.env === 'tusc') {
        plannedAirdropData = tuscAirdrops.find(x => properties.params.id === x.id);
        assetName = "TUSC";
        titleName = "TUSC";
    }

    let winners = plannedAirdropData.calculatedAirdrop.summary;
    let ticketQty = winners.map(x => x.qty).reduce((accumulator, ticket) => accumulator + parseInt(ticket), 0);

    let tableRows = winners.sort((a,b) => b.qty - a.qty).map((winner) => {
        return <tr key={winner.id}>
                    <td>
                        <Link href={`/Account/${properties.params.env}/${winner.id}`} style={{textDecoration: 'none'}}>
                            {winner.id}
                        </Link>
                    </td>
                    <td>
                        {winner.qty}
                    </td>
                    <td>
                        {
                            distroMethod === "Proportionally"
                                ? ((winner.qty/ticketQty)*tokenQuantity).toFixed(5)
                                : ((1/winners.length)*tokenQuantity).toFixed(5)
                        } {tokenName ? tokenName : assetName}
                    </td>
                </tr>
    })

    return (<>
        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Title order={2} ta="center" mt="sm">
                Perform airdrop on the {titleName} blockchain<br/>
                <Link href={`/PlannedAirdrop/${properties.params.env}/${properties.params.id}`}>
                    <Button compact>
                        Back
                    </Button>
                </Link>
            </Title>

            {
                !plannedAirdropData
                    ? <Text>Ticket not found</Text>
                    : <SimpleGrid cols={2} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                Airdrop summary
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                                ID: {plannedAirdropData.id}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                                Hash: {plannedAirdropData.hash}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                                Deduplicated: {plannedAirdropData.deduplicate}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                                Only winning tickets: {plannedAirdropData.alwaysWinning}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                                Blocknumber: {plannedAirdropData.blockNumber}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                                Algorithms: {plannedAirdropData.algos.join(", ")}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                                Winners: {plannedAirdropData.calculatedAirdrop.summary.length}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                                Winning ticket qty: {ticketQty}
                            </Text>
                        </Card>
                        <Card shadow="md" radius="md" padding="sm">
                            <Text fz="lg" fw={600} mt="md">
                                Airdrop options
                            </Text>
                            <TextInput
                                type="string"
                                placeholder={tokenName ? tokenName : assetName}
                                label={`Enter the name of the asset you wish to airdrop`}
                                style={{maxWidth:'400px', marginTop: '10px'}}
                                onChange={(event) => onTokenName(event.currentTarget.value)}
                            />
                            <TextInput
                                type="number"
                                placeholder={tokenQuantity}
                                label={`Enter the quantity of tokens you wish to airdrop`}
                                style={{maxWidth:'400px', marginTop: '10px'}}
                                onChange={(event) => onTokenQuantity(event.currentTarget.value)}
                            />
                            <Radio.Group
                                value={distroMethod}
                                onChange={setDistroMethod}
                                name="distroMethod"
                                label="How should tokens be allocated to winners?"
                                style={{marginTop: '10px'}}
                                withAsterisk
                            >
                                <Group mt="xs">
                                    <Radio value="Equally" label="Equally between winning account IDs" />
                                    <Radio value="Proportionally" label="Proportional to tickets won" />
                                </Group>
                            </Radio.Group>
                        </Card>
                    </SimpleGrid>

            }

            {
                !plannedAirdropData
                    ? <Text>Ticket not found</Text>
                    : <SimpleGrid cols={2} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
                        <Card shadow="md" radius="md" padding="xl">
                            <Table highlightOnHover>
                                <thead>
                                    <tr>
                                        <th>id</th>
                                        <th>Winning tickets</th>
                                        <th>Allocated tokens</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows}
                                </tbody>
                            </Table>
                        </Card>
                    </SimpleGrid>
            }

        </Card>
    </>);
}