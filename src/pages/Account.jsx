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
    ActionIcon
} from '@mantine/core';
import { Link, Route, useLocation } from "wouter";
import { appStore, ticketStore } from '../lib/states';

function humanReadableFloat(satoshis, precision) {
    return satoshis / Math.pow(10, precision)
}

export default function Account(properties) {

    const btsTickets = ticketStore((state) => state.bitshares)
    const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet)
    const tuscTickets = ticketStore((state) => state.tusc)

    let assetName = "";
    let targetJSON = [];
    if (properties.params.env === 'bitshares') {
        targetJSON = btsTickets;
        assetName = "BTS";
    } else if (properties.params.env === 'bitshares_testnet') {
        targetJSON = btsTestnetTickets;
        assetName = "TEST";
    } else if (properties.params.env === 'tusc') {
        targetJSON = tuscTickets;
        assetName = "TUSC";
    }

    let retrievedAccountTickets = targetJSON.filter(x => x.account === properties.params.id);

    let ids = [];
    let tableRows = retrievedAccountTickets.map((ticket) => {
        return <tr key={ticket.id}>
                    <td>
                        <Link href={`/Ticket/${properties.params.env}/${ticket.id}`} style={{textDecoration: 'none'}}>
                            {ticket.id}
                        </Link>
                    </td>
                    <td>
                        {ticket.account}
                    </td>
                    <td>{ticket.current_type}</td>
                    <td>{ticket.target_type}</td>
                    <td>
                        {
                            ticket.amount.amount > 1
                            ? parseFloat(humanReadableFloat(ticket.amount.amount, 5).toFixed(5))
                            : ticket.amount.amount
                        } {assetName}
                    </td>
                    <td>{ticket.status}</td>
                    <td>
                        {
                            ticket.value > 1
                                ? parseFloat(humanReadableFloat(ticket.value, 5).toFixed(5))
                                : ticket.value
                        } {assetName}
                    </td>
                    <td>{ticket.next_auto_update_time}</td>
                    <td>{ticket.next_type_downgrade_time}</td>
                </tr>
    })

    let validTickets = retrievedAccountTickets.map(ticket => {
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

    let lockedQuantity = humanReadableFloat(
        validTickets
        .map(ticket => parseInt(ticket.amount.amount))
        .reduce((accumulator, ticket) => accumulator + parseInt(ticket), 0),
        5
    );

    let smallLocked = humanReadableFloat(
        smallLock
        .map(ticket => parseInt(ticket.amount.amount))
        .reduce((accumulator, ticket) => accumulator + parseInt(ticket), 0),
        5
    );

    let medLocked = humanReadableFloat(
        medLock
        .map(ticket => parseInt(ticket.amount.amount))
        .reduce((accumulator, ticket) => accumulator + parseInt(ticket), 0),
        5
    );

    let lgLocked = humanReadableFloat(
        lgLock
        .map(ticket => parseInt(ticket.amount.amount))
        .reduce((accumulator, ticket) => accumulator + parseInt(ticket), 0),
        5
    );

    let xlLocked = humanReadableFloat(
        xlLock
        .map(ticket => parseInt(ticket.amount.amount))
        .reduce((accumulator, ticket) => accumulator + parseInt(ticket), 0),
        5
    );

    let boostedValue = humanReadableFloat(
        validTickets
        .map(ticket => parseInt(ticket.value))
        .reduce((accumulator, ticket) => accumulator + parseInt(ticket), 0),
        5
    );

    return <>
        <SimpleGrid cols={4} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
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
                    {assetName} ticket values
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {boostedValue}
                </Text>
            </Card>
            <Card shadow="md" radius="md" padding="xl">
                <Text fz="lg" fw={500} mt="md">
                    Total created tickets
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {retrievedAccountTickets.length}
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
                    {smallLock.length} tickets ({((smallLock.length/validTickets.length)*100).toFixed(2)} %)
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {smallLocked} {assetName} locked ({((smallLocked/lockedQuantity)*100).toFixed(2)} %)
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {smallLocked * 2} {assetName} vote weight
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
                    {medLock.length} tickets ({((medLock.length/validTickets.length)*100).toFixed(2)} %)
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {medLocked} {assetName} locked ({((medLocked/lockedQuantity)*100).toFixed(2)} %)
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {medLocked * 4} {assetName} vote weight
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
                    {lgLock.length} tickets ({((lgLock.length/validTickets.length)*100).toFixed(2)} %)
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {lgLocked} {assetName} locked ({((lgLocked/lockedQuantity)*100).toFixed(2)} %)
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {lgLocked * 8} {assetName} vote weight
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
                    {xlLock.length} tickets ({((xlLock.length/validTickets.length)*100).toFixed(2)} %)
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {xlLocked} {assetName} locked ({((xlLocked/lockedQuantity)*100).toFixed(2)} %)
                </Text>
                <Text fz="sm" c="dimmed" mt="sm">
                    {xlLocked * 8} {assetName} vote weight
                </Text>
                <Text fz="xs" c="dimmed" mt="sm">
                    800% vote multiplier
                </Text>
            </Card>
        </SimpleGrid>
        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
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
    </>;
}