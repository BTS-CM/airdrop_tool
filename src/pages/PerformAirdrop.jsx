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
    Loader,
    TextInput
} from '@mantine/core';
import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

import { airdropStore, appStore } from '../lib/states';
import DeepLink from '../lib/DeepLink';
import AirdropCard from './AirdropCard';

function sliceIntoChunks(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        const chunk = arr.slice(i, i + size);
        chunks.push(chunk);
    }
    return chunks;
}

export default function PerformAirdrop(properties) {
    const btsAirdrops = airdropStore((state) => state.bitshares)
    const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet)
    const tuscAirdrops = airdropStore((state) => state.tusc)
    const [tokenQuantity, onTokenQuantity] = useState(1);
    const [tokenName, onTokenName] = useState("")
    const [distroMethod, setDistroMethod] = useState("Proportionally");
    const [accountID, onAccountID] = useState("1.2.x");
    const [deepLink, setDeepLink] = useState([]);

    const nodes = appStore((state) => state.nodes)
    let currentNodes = nodes[properties.params.env];

    let assetName = "";
    let titleName = "token";
    let relevantChain = "";
    let plannedAirdropData = {};
    
    if (properties.params.env === 'bitshares') {
        plannedAirdropData = btsAirdrops.find(x => properties.params.id === x.id);
        assetName = "BTS";
        relevantChain = 'BTS';
        titleName = "Bitshares";
    } else if (properties.params.env === 'bitshares_testnet') {
        plannedAirdropData = btsTestnetAirdrops.find(x => properties.params.id === x.id);
        assetName = "TEST";
        relevantChain = 'BTS_TEST';
        titleName = "Bitshares (Testnet)";
    } else if (properties.params.env === 'tusc') {
        plannedAirdropData = tuscAirdrops.find(x => properties.params.id === x.id);
        assetName = "TUSC";
        relevantChain = 'TUSC';
        titleName = "TUSC";
    }

    let winners = plannedAirdropData.calculatedAirdrop.summary;
    let winnerChunks = sliceIntoChunks(winners.sort((a,b) => b.qty - a.qty), 50);

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

    let airdropCards = winnerChunks.map((chunk, i) => {
        return <AirdropCard
                    tokenQuantity={tokenQuantity}
                    tokenName={tokenName}
                    distroMethod={distroMethod}
                    accountID={accountID}
                    chunk={chunk}
                    chunkItr={i}
                    winnerChunkQty={winnerChunks.length}
                    env={properties.params.env}
                    ticketQty={ticketQty}
                    key={`airdrop_card_${i}`}
                />
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
                    : <SimpleGrid cols={2} spacing="sm" mt={10} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
                        <Card shadow="md" radius="md" padding="xl" mt={20}>
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
                        <Card>
                            <SimpleGrid cols={1} spacing="sm">
                                <Card shadow="md" radius="md" padding="xl">
                                    <Text fz="lg" fw={500} mt="xs">
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
                                        withAsterisk
                                        placeholder={accountID}
                                        label={`Enter your ${titleName} account ID`}
                                        style={{maxWidth:'400px'}}
                                        onChange={(event) => onAccountID(event.currentTarget.value)}
                                    />
                                    <TextInput
                                        type="string"
                                        withAsterisk
                                        placeholder={tokenName ? tokenName : assetName}
                                        label={`Enter the name of the asset you wish to airdrop`}
                                        style={{maxWidth:'400px', marginTop: '10px'}}
                                        onChange={(event) => onTokenName(event.currentTarget.value)}
                                    />
                                    <TextInput
                                        type="number"
                                        withAsterisk
                                        placeholder={tokenQuantity}
                                        label={`Enter the quantity of tokens you wish to airdrop`}
                                        style={{maxWidth:'400px', marginTop: '10px'}}
                                        onChange={(event) => onTokenQuantity(parseFloat(event.currentTarget.value))}
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
                                <Card shadow="md" radius="md" padding="sm" style={{backgroundColor:'#FAFAFA'}}>
                                    <Text fz="lg" fw={500} mt="md">
                                        Proceed with airdrop?
                                    </Text>
                                    <Text fz="sm" c="dimmed" mt="xs">
                                        Airdrops are performed in batches of 50 accounts.<br/>
                                        Therefore {tableRows.length/50 < 1 ? 1 : Math.ceil(tableRows.length/50)} batches are required to complete this airdrop.
                                    </Text>
                                    {
                                        airdropCards
                                    }
                                </Card>
                            </SimpleGrid>
                        </Card>
                    </SimpleGrid>
            }
        </Card>
    </>);
}