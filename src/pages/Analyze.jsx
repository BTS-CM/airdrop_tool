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
    ScrollArea,
    ActionIcon
} from '@mantine/core';
import { Link, Route, useLocation } from "wouter";
import { appStore, ticketStore } from '../lib/states';

function humanReadableFloat(satoshis, precision) {
    return satoshis / Math.pow(10, precision)
}

export default function Analyze(properties) {
    const btsTickets = ticketStore((state) => state.bitshares)
    const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet)
    const tuscTickets = ticketStore((state) => state.tusc)
    const [value, setValue] = useState('bitshares');

    let assetName = "1.3.0";
    let targetJSON = [];
    if (value === 'bitshares') {
        targetJSON = btsTickets;
        assetName = "BTS";
    } else if (value === 'bitshares_testnet') {
        targetJSON = btsTestnetTickets;
        assetName = "TEST";
    } else if (value === 'tusc') {
        targetJSON = tuscTickets;
        assetName = "TUSC"
    }

    let tableRows = targetJSON.map((ticket) => {
        return <tr key={ticket.id}>
                    <td>
                        <Link href={`/Ticket/${value}/${ticket.id}`} style={{textDecoration: 'none'}}>
                            {ticket.id}
                        </Link>
                    </td>
                    <td>
                        <Link href={`/Account/${value}/${ticket.account}`} style={{textDecoration: 'none'}}>
                            {ticket.account}
                        </Link>
                    </td>
                    <td>{ticket.current_type}</td>
                    <td>{ticket.target_type}</td>
                    <td>
                        { parseFloat(humanReadableFloat(ticket.amount.amount, 5).toFixed(5)) } {assetName}
                    </td>
                    <td>{ticket.status}</td>
                    <td>
                        { parseFloat(humanReadableFloat(ticket.value, 5).toFixed(5)) } {assetName}
                    </td>
                    <td>{ticket.next_auto_update_time}</td>
                    <td>{ticket.next_type_downgrade_time}</td>
                </tr>
    })

    let validTickets = targetJSON.map(ticket => {
        if (ticket.current_type != "liquid") {
            return ticket;
        } else {
            return null;
        }
    }).filter(x => x);
    
    let smallLock = validTickets.map(ticket => {
        if (ticket.current_type === "lock_180_days") {
            return ticket;
        } else {
            return null;
        }
    }).filter(x => x);

    let medLock = validTickets.map(ticket => {
        if (ticket.current_type === "lock_360_days") {
            return ticket;
        } else {
            return null;
        }
    }).filter(x => x);

    let lgLock = validTickets.map(ticket => {
        if (ticket.current_type === "lock_720_days") {
            return ticket;
        } else {
            return null;
        }
    }).filter(x => x);

    let xlLock = validTickets.map(ticket => {
        if (ticket.current_type === "lock_forever") {
            return ticket;
        } else {
            return null;
        }
    }).filter(x => x);

    let lockedQuantity = (validTickets.reduce(
        (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount),
        0
    )/10000).toFixed(0);

    let smallLocked = (smallLock.reduce(
        (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount),
        0
    )/10000).toFixed(0);

    let medLocked = (medLock.reduce(
        (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount),
        0
    )/10000).toFixed(0);

    let lgLocked = (lgLock.reduce(
        (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount),
        0
    )/10000).toFixed(0);

    let xlLocked = (xlLock.reduce(
        (accumulator, ticket) => accumulator + parseInt(ticket.amount.amount),
        0
    )/10000).toFixed(0);

    let boostedValue = (validTickets.reduce(
        (accumulator, ticket) => accumulator + parseInt(ticket.value),
        0
    )/10000).toFixed(0);

    let uniqueCount = 0;
    let uniqueIDs = [];
    for (let x = 0; x < validTickets.length; x++) {
        if (!uniqueIDs.includes(validTickets[x].account)) {
            uniqueCount += 1;
            uniqueIDs.push(validTickets[x].account);
        }
    }

    return <>
        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Title order={2} ta="center" mt="sm">
                Blockchain ticket analysis
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
                ?   null
                :   <SimpleGrid cols={4} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                {assetName} locked
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {lockedQuantity}
                            </Text>
                        </Card>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                {assetName} Boosted value
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {boostedValue}
                            </Text>
                        </Card>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                Unique users
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {uniqueCount}
                            </Text>
                        </Card>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                Active tickets
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {validTickets.length}
                            </Text>
                        </Card>            

                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                Locked for 180 days
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {smallLock.length} tickets ({((smallLock.length/uniqueCount)*100).toFixed(2)} %)
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {smallLocked} {assetName} ({((smallLocked/lockedQuantity)*100).toFixed(2)} %)
                            </Text>
                            <Text fz="xs" c="dimmed" mt="sm">
                                200% vote multiplier
                            </Text>
                        </Card>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                Locked for 360 days
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {medLock.length} tickets ({((medLock.length/uniqueCount)*100).toFixed(2)} %)
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {medLocked} {assetName} ({((medLocked/lockedQuantity)*100).toFixed(2)} %)
                            </Text>
                            <Text fz="xs" c="dimmed" mt="sm">
                                400% vote multiplier
                            </Text>
                        </Card>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                Locked for 720 days
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {lgLock.length} tickets ({((lgLock.length/uniqueCount)*100).toFixed(2)} %)
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {lgLocked} {assetName} ({((lgLocked/lockedQuantity)*100).toFixed(2)} %)
                            </Text>
                            <Text fz="xs" c="dimmed" mt="sm">
                                800% vote multiplier
                            </Text>
                        </Card>
                        <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="md">
                                Locked forever
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {xlLock.length} tickets ({((xlLock.length/uniqueCount)*100).toFixed(2)} %)
                            </Text>
                            <Text fz="sm" c="dimmed" mt="sm">
                                {xlLocked} {assetName} ({((xlLocked/lockedQuantity)*100).toFixed(2)} %)
                            </Text>
                            <Text fz="xs" c="dimmed" mt="sm">
                                800% vote multiplier
                            </Text>
                        </Card>
                    </SimpleGrid>
        }

        {
            !tableRows || !tableRows.length 
            ?   <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                    <Title order={3} ta="center" mt="sm">
                        You must fetch the ticket data for this blockchain.
                    </Title>
                </Card>
            :   <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>      
                    <Table>
                        <thead>
                            <tr>
                                <th>id</th>
                                <th>account</th>
                                <th>current type</th>
                                <th>target type</th>
                                <th>amount</th>
                                <th>current status</th>
                                <th>value</th>
                                <th>next update time</th>
                                <th>next downgrade time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows}
                        </tbody>
                    </Table>
                </Card>
        }
        
    </>;
}