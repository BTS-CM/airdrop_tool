import React, { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

import {
    Title,
    Text,
    SimpleGrid,
    TextInput,
    Card,
    Box,
    Modal,
    Radio,
    Table,
    Button,
    Col,
    Paper,
    Group,
    Badge
} from '@mantine/core';
import { leaderboardStore, identitiesStore, beetStore, appStore } from '../lib/states';
import DeepLink from '../lib/DeepLink';

export default function Create(properties) {
    const [value, setValue] = useState('bitshares');
    const [ticketType, setTicketType] = useState("lock_180_days");
    const [beetType, setBeetType] = useState();
    const [deepLink, setDeepLink] = useState();
    const [accountID, onAccountID] = useState(properties.params.id ?? "1.2.x");

    const [tokenQuantity, onTokenQuantity] = useState(1);
    const [inProgress, setInProgress] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);

    const btsLeaderboard = leaderboardStore((state) => state.bitshares);
    const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
    const tuscLeaderboard = leaderboardStore((state) => state.tusc);

    const nodes = appStore((state) => state.nodes)
    let currentNodes = nodes[value];

    const storedConnections = identitiesStore((state) => state.storedConnections);
    const storeConnection = identitiesStore((state) => state.storeConnection);
    const removeConnection = identitiesStore((state) => state.removeConnection);

    const identities = identitiesStore((state) => state.identities);
    const setIdentities = identitiesStore((state) => state.setIdentities);
    const removeIdentity = identitiesStore((state) => state.removeIdentity);

    const connection = beetStore((state) => state.connection);
    const authenticated = beetStore((state) => state.authenticated);
    const isLinked = beetStore((state) => state.isLinked);
    const identity = beetStore((state) => state.identity);
    const connect = beetStore((state) => state.connect);
    const link = beetStore((state) => state.link);

    /*
    const relevantIdentities = identities.filter((x) => x.chain === relevantChain);

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
        response = (
            <Col span={12} key="connect">
                <Paper padding="sm" shadow="xs">
                <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
                    <Text size="md">
                        Which previously linked BEET account do you want to use?
                    </Text>
                    <ScrollArea sx={{ height: rows.length > 1 && rows.length < 3 ? rows.length * 55 : 120 }}>
                        <Table sx={{ minWidth: 700 }}>
                            <tbody>{rows}</tbody>
                        </Table>
                    </ScrollArea>
                </Box>
                </Paper>
                <br />
                <Paper padding="sm" shadow="xs">
                <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
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
                </Box>
                </Paper>
            </Col>
        );
    } else if (inProgress === false && !relevantIdentities.length) {
        response = [
            <Col span={12} key="connect">
                <Paper padding="sm" shadow="xs">
                <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
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
                </Box>
                </Paper>
            </Col>,
            <Col span={12} key="download">
                <Paper padding="sm" shadow="xs">
                <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
                    <Text size="md">
                        Don't yet have the Bitshares BEET wallet installed? Go download and install it.
                    </Text>
                    <Text size="md">
                        Once installed, create a wallet and proceed to connect above.
                    </Text>
                </Box>
                </Paper>
            </Col>,
        ];
    } else {
        response = (
            <Box mx="auto" sx={{ padding: '10px' }}>
                <span>
                    <Loader variant="dots" />
                    <Text size="md">
                        Connecting to BEET
                    </Text>
                </span>
            </Box>
        );
    }
    */

    let relevantChain = "bitshares";
    let assetName = "1.3.0";
    let leaderboardJSON = [];
    let currentlyLocked = 0;

    if (value === 'bitshares') {
        leaderboardJSON = btsLeaderboard;
        currentlyLocked = btsLeaderboard.reduce((accumulator, entry) => accumulator + parseInt(entry.amount), 0);
        assetName = "BTS";
        relevantChain = 'BTS';
    } else if (value === 'bitshares_testnet') {
        leaderboardJSON = btsTestnetLeaderboard;
        currentlyLocked = btsTestnetLeaderboard.reduce((accumulator, entry) => accumulator + parseInt(entry.amount), 0);
        assetName = "TEST";
        relevantChain = 'BTS_TEST';
    } else if (value === 'tusc') {
        leaderboardJSON = tuscLeaderboard;
        currentlyLocked = tuscLeaderboard.reduce((accumulator, entry) => accumulator + parseInt(entry.amount), 0);
        assetName = "TUSC";
        relevantChain = 'TUSC';
    }

    let targetType = 0;
    let tokenLockValue = 0;
    if (ticketType === "lock_180_days") {
        targetType = 1;
        tokenLockValue = tokenQuantity * 2;
    } else if (ticketType === "lock_360_days") {
        targetType = 2;
        tokenLockValue = tokenQuantity * 4;
    } else if (ticketType === "lock_720_days") {
        targetType = 3;
        tokenLockValue = tokenQuantity * 8;
    } else {
        targetType = 4;
        tokenLockValue = tokenQuantity * 8;
    }

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
        <span>
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
        </span>
    ) : (
        <span>
        <Loader variant="dots" />
        <Text size="md">
        Waiting on response from BEET prompt
        </Text>
        </span>
    );

    async function generateDeepLink() {
        let beetLink = new DeepLink(
            'Airdrop tool creating ticket',
            relevantChain,
            'airdrop_tool',
            'localhost',
            ''
        );

        let TXBuilder = await beetLink.inject(
            TransactionBuilder,
            {sign: true, broadcast: true},
            false
        );

        try {
            await Apis.instance(
                currentNodes[0],
                true,
                10000,
                {enableCrypto: false, enableOrders: true},
                (error) => console.log(error),
            ).init_promise;
        } catch (error) {
            console.log(`api instance: ${error}`);
            return;
        }
        
        let tr = new TXBuilder();
        tr.add_type_operation(
            'ticket_create',
            {
                account: accountID,
                target_type: targetType,
                amount: {
                    amount: tokenQuantity * 100000,
                    asset_id: "1.3.0"
                },
                extensions: []
            }
        );
        
        try {
            await tr.update_head_block();
        } catch (error) {
            console.error(error);
            return;
        }

        try {
            await tr.set_required_fees();
        } catch (error) {
            console.error(error);
            return;
        }

        try {
            tr.set_expire_seconds(7200);
        } catch (error) {
            console.error(error);
            return;
        }

        try {
            tr.add_signer("inject_wif");
        } catch (error) {
            console.error(error);
            return;
        }

        try {
            tr.finalize();
        } catch (error) {
            console.error(error);
            return;
        }
        
        let encryptedPayload;
        try {
            encryptedPayload = await tr.encrypt();
        } catch (error) {
            console.error(error);
            return;
        }

        console.log({relevantChain, encryptedPayload})
        setDeepLink(`rawbeet://api?chain=${relevantChain}&request=${encryptedPayload}`);
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

            <TextInput
                type="string"
                placeholder={accountID}
                label={`Enter your ${value} account ID`}
                style={{maxWidth:'300px', marginTop: '20px'}}
                onChange={(event) => onAccountID(event.currentTarget.value)}
            />

            <Text fz="md" style={{marginTop: '15px'}}>
                By locking {tokenQuantity} {assetName} your ticket will be equivalent to {tokenLockValue} {assetName} in terms of voting and airdrop surface area.
            </Text>

            <Modal opened={opened} onClose={close} title="Creating a ticket">
                {
                    !beetType
                        ? <>
                            <Text>
                                How do you want to proceed?
                            </Text>
                            <Button m="xs" onClick={() => setBeetType("raw")}>
                                Raw deeplink (unverified)
                            </Button>
                            <Button m="xs" onClick={() => setBeetType("daap")}>
                                WebSockets (link account & verified)
                            </Button>
                        </>
                        : null
                }
                {
                    beetType && beetType === "raw" && !deepLink
                        ? <>
                            <Text>Raw deeplink (unverified)</Text>
                            <Text fz="xs">
                                1. Launch the BEET wallet and navigate to "Raw Link" in the menu.<br/>
                                2. From this page you can either allow all operations, or solely allow operation 57 "Ticket create" (then click save).<br/>
                                3. Once "Ready for raw links" shows, click the following button to proceed.
                            </Text>
                            {relevantChain}
                            <Button m="xs" onClick={async () => await generateDeepLink()}>
                                Generate raw deeplink
                            </Button>
                            <Button m="xs" onClick={() => setBeetType()}>
                                Back
                            </Button>
                        </>
                        : null
                }
                {
                    deepLink
                        ? <>
                            <Text>Raw deeplink generated</Text>
                            <Text fz="xs">
                                1. Your BEET deeplink has been generated, click the button to proceed.<br/>
                                2. A BEET prompt will display, verify the contents then approve the create ticket prompt.<br/>
                                3. Go to the 'Fetch tickets' page to download your ticket for analysis.
                            </Text>
                            <a href={deepLink}>
                                <Button m="xs">
                                    Broadcast to BEET
                                </Button>
                            </a>
                            <Button m="xs" onClick={() => setBeetType()}>
                                Back
                            </Button>
                        </>
                        : null
                }
                {
                    beetType && beetType === "daap"
                        ? <>
                            <Text>WebSockets (link account & verified)</Text>

                            <Button m="xs" onClick={() => setBeetType()}>
                                Back
                            </Button>
                        </>
                        : null
                }
            </Modal>

            <Group position="center">
                <Button style={{marginTop:'20px'}} onClick={open}>Ask BEET to create ticket</Button>
            </Group>
        </Card>

        <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
            <Title order={5} ta="center" mt="xs">
                As a result of creating this ticket, the top 10 leaderboard stats will change as such
            </Title>
            <Table miw={800} verticalSpacing="sm" mt="md">
                <thead>
                    <tr>
                        <th align='left'>ID</th>
                        <th align='left'>Amount</th>
                        <th align='left'>Before</th>
                        <th align='left'>After</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        leaderboardJSON.slice(0, 10).map(leader => {
                            return <tr key={leader.id}>
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