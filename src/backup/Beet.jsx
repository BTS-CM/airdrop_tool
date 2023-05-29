import React, { useState, useEffect } from 'react';
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
    Col,
    Paper,
    Box,
    Group,
    Tooltip,
    Accordion,
    JsonInput,
    ActionIcon,
    Loader,
    TextInput
} from '@mantine/core';

import {
    HiChevronUp,
    HiChevronDown,
    HiX
} from 'react-icons/hi'

import { leaderboardStore, identitiesStore, beetStore, appStore } from '../lib/states';

export default function Beet(properties) {

    const account = appStore((state) => state.account);
    const setAccount = appStore((state) => state.setAccount);

    const blockchainNodes = appStore((state) => state.nodes);
    const replaceNodes = appStore((state) => state.replaceNodes);
    const removeURL = appStore((state) => state.removeURL);

    const storedConnections = identitiesStore((state) => state.storedConnections);
    const storeConnection = identitiesStore((state) => state.storeConnection);
    const removeConnection = identitiesStore((state) => state.removeConnection);

    const identities = identitiesStore((state) => state.identities);
    const setIdentities = identitiesStore((state) => state.setIdentities);
    const removeIdentity = identitiesStore((state) => state.removeIdentity);
    
    const connect = beetStore((state) => state.connect);
    const link = beetStore((state) => state.link);

    const connection = beetStore((state) => state.connection);
    const authenticated = beetStore((state) => state.authenticated);
    const isLinked = beetStore((state) => state.isLinked);
    const identity = beetStore((state) => state.identity);

    const [inProgress, setInProgress] = useState(false);

    useEffect(() => {
        if (!account && identity && identity.requested.account && identity.requested.account.id) {
            setAccount(identity.requested.account.id);
        }
    }, [account, identity]);

    console.log({connection, authenticated, isLinked})

    let assetName = "BTS";
    let relevantChain = "bitshares";
    if (properties.env === 'bitshares') {
        assetName = "BTS";
        relevantChain = 'BTS';
    } else if (properties.env === 'bitshares_testnet') {
        assetName = "TEST";
        relevantChain = 'BTS_TEST';
    } else if (properties.env === 'tusc') {
        assetName = "TUSC";
        relevantChain = 'TUSC';
    }

    const relevantIdentities = identities.filter((x) => x.chain === relevantChain);
    //console.log({properties, relevantIdentities});

    /**
     * Reconnect to Beet with chosen identity
     * @param {Object} identity
     */
    async function reconnect(identity) {
        setInProgress(true);

        setTimeout(() => {
            setInProgress(false);
        }, 5000);

        try {
            await connect(identity);
        } catch (error) {
            console.error(error);
            setInProgress(false);
            return;
        }

        setIdentity(identity);
        // setIsLinked(true);
        setIdentities(identity);
        setInProgress(false);
    }

    /**
     * Connect to link
     */
    async function connectToBeet() {
        setInProgress(true);

        setTimeout(() => {
            setInProgress(false);
        }, 3000);

        try {
            await connect();
        } catch (error) {
            console.log(error);
        }

        setInProgress(false);
    }

    /**
     * Removing a previously linked identity from the identity store
     * @param {Object} rowIdentity
     */
    function remove(rowIdentity) {
        try {
            removeIdentity(rowIdentity.requested.account.id);
        } catch (error) {
            console.log(error);
        }

        try {
            removeConnection(rowIdentity.identityhash);
        } catch (error) {
            console.log(error);
        }
    }

    /*
    * After connection attempt to link app to Beet client
    */
    async function _linkToBeet() {
        setInProgress(true);

        try {
            await link(environment);
        } catch (error) {
            console.error(error);
        }

        setInProgress(false);
    }

    const linkContents = inProgress === false ? (
        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Text size="md">
                Connected to Beet wallet successfully.
            </Text>
            <Text size="md">
                Proceed with linking this app to your Beet wallet below.
            </Text>
            <Button
                sx={{ marginTop: '15px', marginRight: '5px' }}
                onClick={() => {
                    _linkToBeet();
                }}
            >
                Link to Beet
            </Button>
        </Card>
    ) : (
        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Loader variant="dots" />
            <Text size="md">
                Waiting on response from BEET prompt
            </Text>
        </Card>
    );

    const rows = relevantIdentities
                    .map((row) => (
                        <tr key={`${row.requested.account.name}_row`}>
                            <td>
                            <Button
                                variant="light"
                                sx={{ marginTop: '5px', marginRight: '5px' }}
                                onClick={() => {
                                    reconnect(row);
                                }}
                            >
                                {row.requested.account.name}
                                {' '}
                                (
                                {row.requested.account.id}
                                )
                            </Button>
                            <Button
                                sx={{ marginTop: '5px' }}
                                variant="subtle"
                                color="red"
                                compact
                                onClick={() => {
                                    remove(row);
                                }}
                            >
                                Remove
                            </Button>
                            </td>
                        </tr>
                    ))
                    .filter((x) => x);

    let response;
    if (inProgress === false && rows.length) {
        response = <>
            <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Text size="md">
                    Which previously linked BEET account do you want to use?
                </Text>
                <ScrollArea sx={{ height: rows.length > 1 && rows.length < 3 ? rows.length * 55 : 120 }}>
                    <Table sx={{ minWidth: 700 }}>
                        <tbody>{rows}</tbody>
                    </Table>
                </ScrollArea>
            </Card>
            <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Text size="md">
                    Want to use a different account?
                </Text>
                <Button
                    variant="light"
                    sx={{ marginTop: '15px', marginRight: '5px', marginBottom: '5px' }}
                    onClick={() => {
                        connectToBeet();
                    }}
                >
                    Connect with new account
                </Button>
            </Card>
        </>;
    } else if (inProgress === false && !relevantIdentities.length) {
        response = <>
            <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Text size="md">
                    This tool is designed for use with the Bitshares BEET Wallet.
                </Text>
                <Text size="md">
                    Launch and unlock it, then click the connect button below to proceed.
                </Text>
                <Button
                    sx={{ marginTop: '15px', marginRight: '5px' }}
                    onClick={() => {
                        connectToBeet();
                    }}
                >
                    Connect to Beet
                </Button>
            </Card>
            <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Text size="md">
                    Don't yet have the Bitshares BEET wallet installed? Go download and install it.
                </Text>
                <Text size="md">
                    Once installed, create a wallet and proceed to connect above.
                </Text>
            </Card>
        </>;
    } else {
        response = <>
            <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                <Loader variant="dots" />
                <Text size="md">
                    Connecting to BEET
                </Text>
            </Card>
        </>;
    }

    return <>
        <SimpleGrid cols={1} spacing="xl" mt="sm">
            {response}
        </SimpleGrid>
    </>;
}