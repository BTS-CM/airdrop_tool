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
    JsonInput
} from '@mantine/core';
import { v4 as uuidv4 } from 'uuid';

import { airdropStore } from '../lib/states';

export default function PerformAirdrop(properties) {
    const btsAirdrops = airdropStore((state) => state.bitshares)
    const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet)
    const tuscAirdrops = airdropStore((state) => state.tusc)

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
                    : <SimpleGrid cols={3} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                ID
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {plannedAirdropData.id}
                            </Text>
                        </Card>
                    </SimpleGrid>

            }

        </Card>
    </>);
}