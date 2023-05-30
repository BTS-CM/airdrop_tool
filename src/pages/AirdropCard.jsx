import React, { useState } from 'react';
import {
    Text,
    Card,
    Button,
    Loader,
    Modal,
    JsonInput,
    Accordion
} from '@mantine/core';
import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";
import { useDisclosure } from '@mantine/hooks';

import { appStore } from '../lib/states';
import DeepLink from '../lib/DeepLink';

export default function PerformAirdrop(properties) {

    let tokenQuantity = properties.tokenQuantity;
    let tokenName = properties.tokenName;
    let distroMethod = properties.distroMethod;
    let accountID = properties.accountID;

    let chunk = properties.chunk;
    let chunkItr = properties.chunkItr;
    let winnerChunkQty = properties.winnerChunkQty;
    let env = properties.env;
    let ticketQty = properties.ticketQty;

    const [deepLink, setDeepLink] = useState();
    const [tx, setTX] = useState();
    const [inProgress, setInProgress] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);

    const nodes = appStore((state) => state.nodes)
    let currentNodes = nodes[env];

    let assetName = "";
    let relevantChain = "";
    if (env === 'bitshares') {
        assetName = "BTS";
        relevantChain = 'BTS';
    } else if (env === 'bitshares_testnet') {
        assetName = "TEST";
        relevantChain = 'BTS_TEST';
    } else if (env === 'tusc') {
        assetName = "TUSC";
        relevantChain = 'TUSC';
    }

    /**
     * Generating an airdrop Beet deep link
     * @param {Array} chunk 
     * @param {String} key
     * @returns {String}
     */
    async function generateDeepLink(chunk, key) {
        setInProgress(true);
        let beetLink = new DeepLink(
            'Airdrop tool airdropping',
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

        let ops = chunk.map(x => {
            return {
                fee: {
                    amount: 0,
                    asset_id: "1.3.0"
                },
                from: accountID,
                to: x.id,
                amount: {
                    amount: parseFloat(
                        distroMethod === "Proportionally"
                        ?  ((x.qty/ticketQty)*tokenQuantity).toFixed(5)
                        :  (((1/winners.length)*tokenQuantity).toFixed(5)) * chunk.length
                    ) * 100000,
                    asset_id: "1.3.0"
                }
            }
        })

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
            setInProgress(false);
            return;
        }

        let tr = new TXBuilder();
        for (let i = 0; i < ops.length; i++) {
            tr.add_type_operation('transfer', ops[i]);
        }
        
        try {
            await tr.update_head_block();
        } catch (error) {
            console.error(error);
            setInProgress(false);
            return;
        }

        try {
            await tr.set_required_fees();
        } catch (error) {
            console.error(error);
            setInProgress(false);
            return;
        }

        try {
            tr.set_expire_seconds(7200);
        } catch (error) {
            console.error(error);
            setInProgress(false);
            return;
        }

        try {
            tr.add_signer("inject_wif");
        } catch (error) {
            console.error(error);
            setInProgress(false);
            return;
        }

        try {
            tr.finalize();
        } catch (error) {
            console.error(error);
            setInProgress(false);
            return;
        }

        setTX(tr);
        
        let encryptedPayload;
        try {
            encryptedPayload = await tr.encrypt();
        } catch (error) {
            console.error(error);
            setInProgress(false);
            return;
        }

        setInProgress(false);
        console.log({relevantChain, encryptedPayload})
        setDeepLink(`rawbeet://api?chain=${relevantChain}&request=${encryptedPayload}`);
    }

    let currentChunkValue = distroMethod === "Proportionally"
        ?   parseFloat(chunk.map(z => {
                return ((z.qty/ticketQty)*tokenQuantity).toFixed(5)
            }).reduce((accumulator, ticket) => accumulator + parseFloat(ticket), 0).toFixed(5))
        :   (((1/winners.length)*tokenQuantity).toFixed(5)) * chunk.length;

    return <Card key={`airdrop_${chunkItr}`} mt="md" shadow="md" radius="md" padding="xl">
                <Text>
                    Airdrop #{chunkItr + 1}/{winnerChunkQty}
                </Text>
                <Text fz="sm" c="dimmed">
                    {chunk.length} accounts {chunk.length > 1 ? `(from ${chunk[0].id} to ${chunk[chunk.length - 1].id})` : null}<br/>
                    { currentChunkValue } {tokenName ? tokenName : assetName} being distributed
                </Text>
                <Modal
                    opened={opened}
                    onClose={() => {
                        setDeepLink();
                        close();
                        setTX();
                    }}
                    title={`Airdrop #${chunkItr + 1}/${winnerChunkQty}`}
                >
                    {
                        !deepLink && !inProgress
                            ?   <>
                                    <Text>Via raw Beet deeplink</Text>
                                    <Text m="sm" fz="xs">
                                        1. Launch the BEET wallet and navigate to "Raw Link" in the menu.<br/>
                                        2. From this page you can either allow all operations, or solely allow operation 0 "Transfer" (then click save).<br/>
                                        3. Once "Ready for raw links" shows in Beet submit this request.
                                    </Text>
                                    <Button mt="md" onClick={async () => await generateDeepLink(chunk, chunkItr.toString())}>
                                        Generate Deeplink
                                    </Button>
                                </>
                            : null
                    }
                    {
                        inProgress
                            ? <Loader size="xs" variant="dots" />
                            : null
                    }
                    {
                        deepLink
                            ?   <>
                                    <Text>Raw deeplink generated</Text>
                                    <Text fz="xs">
                                        1. Your BEET deeplink has been generated, click the button to proceed.<br/>
                                        2. A BEET prompt will display.<br/>
                                        3. Verify the prompt's contents before approving the airdrop.
                                    </Text>
                                    <a href={deepLink}>
                                        <Button mt="md">
                                            Submit to Beet
                                        </Button>
                                    </a>
                                    <Accordion mt="md">
                                        <Accordion.Item key="json" value={"operation_json"}>
                                            <Accordion.Control>
                                                Proposed airdrop operation JSON
                                            </Accordion.Control>
                                            <Accordion.Panel style={{backgroundColor: '#FAFAFA'}}>
                                                <JsonInput
                                                    placeholder="Textarea will autosize to fit the content"
                                                    defaultValue={JSON.stringify(tx)}
                                                    validationError="Invalid JSON"
                                                    formatOnBlur
                                                    autosize
                                                    minRows={4}
                                                    maxRows={15}
                                                />
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    </Accordion>
                                </>
                            :   null
                    }
                </Modal>
                {
                    accountID.length > 5
                        ?   <Button mt="md" onClick={open}>Begin airdrop</Button>
                        :   <Button mt="md" disabled>Begin airdrop</Button>
                }
                
            </Card>;
}