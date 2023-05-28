import React, { useEffect, useState } from 'react';
import { Link } from "wouter";
import {
    Title,
    Text,
    SimpleGrid,
    Badge,
    ActionIcon,
    Card,
    Radio,
    Table,
    Button,
    ScrollArea,
    Group
} from '@mantine/core';

import { airdropStore } from '../lib/states';

export default function CalculatedAirdrops(properties) {
    const btsAirdrops = airdropStore((state) => state.bitshares)
    const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet)
    const tuscAirdrops = airdropStore((state) => state.tusc)

    const eraseOne = airdropStore((state) => state.eraseOne);

    const [value, setValue] = useState('bitshares');

    let chosenAirdropData = [];
    if (value === 'bitshares') {
        chosenAirdropData = btsAirdrops;
    } else if (value === 'bitshares_testnet') {
        chosenAirdropData = btsTestnetAirdrops;
    } else if (value === 'tusc') {
        chosenAirdropData = tuscAirdrops;
    }
    
    /*
        <td width={200}>
            {
                airdrop.algos.map(algo => {
                    return <Badge style={{margin:'1px'}}>{algo}</Badge>
                })
            }
        </td>
    */

    let tableRows = chosenAirdropData && chosenAirdropData.length
                        ? chosenAirdropData.map((airdrop) => {
                                return <tr key={airdrop.id}>
                                            <td>
                                                <Link href={`/PlannedAirdrop/${value}/${airdrop.id}`}>
                                                    <Button compact style={{margin:'1px'}}>{airdrop.id.slice(0, 8)}...</Button>
                                                </Link>
                                            </td>
                                            <td>{airdrop.hash}</td>
                                            <td>{airdrop.blockNumber}</td>
                                            <td>{airdrop.calculatedAirdrop.summary.length}</td>
                                            <td>{airdrop.algos.length}</td>
                                            <td>{airdrop.deduplicate}</td>
                                            <td>{airdrop.alwaysWinning}</td>
                                            <td>
                                            <ActionIcon onClick={() => {
                                                eraseOne(value, airdrop.id);
                                            }}>
                                                ❌
                                            </ActionIcon>
                                            </td>
                                        </tr>
                            })
                        : null;

    return (<>
        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Title order={2} ta="center" mt="sm">
                Calculated airdrops
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
            !tableRows || !tableRows.length 
            ?   <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                    <Title order={4} ta="center" mt="sm">
                        No airdrops for this blockchain seem to have been created yet?<br/>
                        <Link href="/Calculate">
                            <Button mt="sm">
                                Calculate airdrop
                            </Button>
                        </Link>
                    </Title>
                </Card>
            :   <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                    <Table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Hash</th>
                                <th>Block number</th>
                                <th>Winners</th>
                                <th>Algos</th>
                                <th>Deduplicated</th>
                                <th>Only winners</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows}
                        </tbody>
                    </Table>
                </Card>
        }
    </>);
}