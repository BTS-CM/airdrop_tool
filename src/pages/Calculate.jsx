import React, { useState } from 'react';
import { Link } from "wouter";
import { Apis } from 'bitsharesjs-ws';
import { v4 as uuidv4 } from 'uuid';

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
import blake from 'blakejs';

import { executeCalculation } from '../lib/algos';
import { appStore, leaderboardStore, airdropStore } from '../lib/states';

export default function Calculate(properties) {
    const btsLeaderboard = leaderboardStore((state) => state.bitshares)
    const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet)
    const tuscLeaderboard = leaderboardStore((state) => state.tusc)

    const nodes = appStore((state) => state.nodes);
    const changeURL = appStore((state) => state.changeURL);
    const changeAirdrops = airdropStore((state) => state.changeAirdrops);

    const [value, setValue] = useState('bitshares');
    const [hash, setHash] = useState('plain');

    const [randID, setRandID] = useState('none');

    const [blockNumber, onBlockNumber] = useState(1000);
    const [selection, setSelection] = useState([]);

    const [deduplicate, setDeduplicate] = useState("Yes");
    const [alwaysWinning, setAlwaysWinning] = useState("Yes");

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

    /**
     * For identifying non-numeric chars in witness signature
     * @param {String} c 
     * @returns {Boolean}
     */
    function isCharNumber(c) {
        return c >= '0' && c <= '9';
    }

    let lastID;
    async function performCalculation() {
        setProgress('calculating');

        try {
            await Apis.instance(nodes[value][0], true).init_promise;
        } catch (error) {
            console.log(error);
            changeURL(value);
            return;
        }

        let object;
        try {
            object = await Apis.instance().db_api().exec("get_block", [blockNumber])
        } catch (error) {
            console.log(error);
            return;
        }

        if (!object) {
            console.log('get_block failed');
            return;
        }

        let witness_signature = object.witness_signature;

        if (hash === 'Blake2B') { // 512 bit
            witness_signature = blake.blake2bHex(witness_signature);
        } else if (hash === 'Blake2S') { // 256 bit
            witness_signature = blake.blake2sHex(witness_signature);
        }

        let filtered_signature = witness_signature.split('').map((char) => {
            if (isCharNumber(char)) {
                return char; // fine
            } else {
                return char.charCodeAt(0).toString(); // swap letters for numbers
            }
        }).join('')

        let calculatedAirdrop;
        try {
            calculatedAirdrop = await executeCalculation(
                filtered_signature,
                selection,
                deduplicate,
                alwaysWinning,
                leaderboardJSON
            );
        } catch (error) {
            console.log(error);
        }

        let calcID = uuidv4();
        setRandID(calcID);
        let finalAirdropData = {
            hash,
            blockNumber,
            algos: selection,
            deduplicate,
            alwaysWinning,
            witness_signature,
            filtered_signature,
            calculatedAirdrop,
            id: calcID
        };

        changeAirdrops(value, finalAirdropData);

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
                <Button m="xs" onClick={() => setProgress('planning')}>
                    Calculate another airdrop?
                </Button>
                <Link href={`/PlannedAirdrop/${value}/${randID}`}>
                    <Button m="xs">
                        View generated airdrop
                    </Button>
                </Link>
                <Link href="/CalculatedAirdrops">
                    <Button m="xs">
                        View all generated airdrops
                    </Button>
                </Link>
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
            !leaderboardJSON || !leaderboardJSON.length
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
            !leaderboardJSON || !leaderboardJSON.length
                ? null
                : <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                    <Title order={4} ta="left" mt="xs">
                        Winning ticket options
                    </Title>
                    <Radio.Group
                        value={deduplicate}
                        onChange={setDeduplicate}
                        name="chosenDuplicate"
                        label="Should winning tickets be deduplicated?"
                        description="I.e. can a ticket win more than once? Yes or no?"
                        withAsterisk
                    >
                        <Group mt="xs">
                            <Radio value="Yes" label="Yes" />
                            <Radio value="No" label="No" />
                        </Group>
                    </Radio.Group>
                    <Radio.Group
                        value={alwaysWinning}
                        onChange={setAlwaysWinning}
                        name="chosenWinning"
                        label="Should winning tickets always be chosen?"
                        description="E.g. If 600 tickets exist, convert #1000 into #400. (drawn - last)"
                        withAsterisk
                        style={{marginTop: '15px'}}
                    >
                        <Group mt="xs">
                            <Radio value="Yes" label="Yes" />
                            <Radio value="No" label="No" />
                        </Group>
                    </Radio.Group>
                </Card>
        }

        {
            !leaderboardJSON || !leaderboardJSON.length
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
            !leaderboardJSON || !leaderboardJSON.length
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
            !leaderboardJSON || !leaderboardJSON.length
                ? null
                : <Card shadow="md" radius="md" padding="xl" style={{marginTop:'25px'}}>
                    <Title order={4} ta="left" mt="xs">
                        Proceed with airdrop calculation
                    </Title>
                    <Text>
                        Your calculated airdrop vector will be made available in the airdrop page once completed.
                    </Text>
                    {
                        !selection.length
                            ? <Button disabled style={{marginTop:'10px'}}>
                                Perform airdrop calculation
                            </Button>
                            : <Button style={{marginTop:'10px'}} onClick={() => performCalculation()}>
                                    Perform airdrop calculation
                                </Button>
                    }
                    
                </Card>
        }


    </>);
}