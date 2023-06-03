import React, { useState } from 'react';
import {
  Text,
  Card,
  Button,
  Loader,
  Modal,
  JsonInput,
  Accordion,
} from '@mantine/core';
import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { appStore } from '../lib/states';
import DeepLink from '../lib/DeepLink';

export default function AirdropCard(properties) {
  const { tokenQuantity } = properties;
  const { tokenName } = properties;
  const { distroMethod } = properties;
  const { accountID } = properties;

  const { chunk } = properties;
  const { chunkItr } = properties;
  const { winnerChunkQty } = properties;
  const { env } = properties;
  const { ticketQty } = properties;
  const { tokenDetails } = properties;
  const { quantityWinners } = properties;

  const [airdropData, setAirdropData] = useState();
  const [tx, setTX] = useState();
  const [inProgress, setInProgress] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[env];

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
     * @param {Array} currentChunk
     * @param {String} key
     * @returns {String}
     */
  async function generateDeepLink(currentChunk, key) {
    const { t, i18n } = useTranslation();
    setInProgress(true);
    const beetLink = new DeepLink(
      'Airdrop tool airdropping',
      relevantChain,
      'airdrop_tool',
      'localhost',
      '',
    );

    const TXBuilder = await beetLink.inject(
      TransactionBuilder,
      { sign: true, broadcast: true },
      false,
    );

    const ops = currentChunk.map((x) => ({
      fee: {
        amount: 0,
        asset_id: tokenDetails.id,
      },
      from: accountID,
      to: x.id,
      amount: {
        amount: parseFloat(
          distroMethod === "Proportionally"
            ? ((x.qty / ticketQty) * tokenQuantity).toFixed(tokenDetails.precision)
            : (((1 / quantityWinners) * tokenQuantity).toFixed(tokenDetails.precision)),
        ) * 100000,
        asset_id: tokenDetails.id,
      },
    }));

    try {
      await Apis.instance(
        currentNodes[0],
        true,
        10000,
        { enableCrypto: false, enableOrders: true },
        (error) => console.log(error),
      ).init_promise;
    } catch (error) {
      console.log(`api instance: ${error}`);
      setInProgress(false);
      return;
    }

    const tr = new TXBuilder();
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
    setAirdropData(encryptedPayload);
  }

  const currentChunkValue = distroMethod === "Proportionally"
    ? parseFloat(
      chunk
        .map((z) => ((z.qty / ticketQty) * tokenQuantity).toFixed(5))
        .reduce((accumulator, ticket) => accumulator + parseFloat(ticket), 0).toFixed(5)
    )
    : (((1 / quantityWinners) * tokenQuantity).toFixed(5)) * chunk.length;

  return (
    <Card key={`airdrop_${chunkItr}`} mt="md" shadow="md" radius="md" padding="xl">
      <Text>
        Airdrop #
        {chunkItr + 1}
        /
        {winnerChunkQty}
      </Text>
      <Text fz="sm" c="dimmed">
        {`${chunk.length} accounts ${chunk.length > 1 ? `(from ${chunk[0].id} to ${chunk[chunk.length - 1].id})` : null}`}
        <br />
        { `${currentChunkValue} ${tokenName || assetName} being distributed` }
      </Text>
      <Modal
        opened={opened}
        onClose={() => {
          setAirdropData();
          close();
          setTX();
        }}
        title={`Airdrop #${chunkItr + 1}/${winnerChunkQty}`}
      >
        {
          !airdropData && !inProgress
            ? (
              <>
                <Text>Via local file upload</Text>
                <Text m="sm" fz="xs">
                  1. Launch the BEET wallet and navigate to &quot;Local&quot; in the menu.
                  <br />
                  2. At this page either allow all, or allow just operation 0 &quot;Transfer&quot;.
                  <br />
                  3. Once at the local upload page, click the button below to proceed.
                </Text>
                <Button
                  mt="md"
                  onClick={
                    async () => await generateDeepLink(chunk, chunkItr.toString())
                  }
                >
                  Generate airdrop JSON file
                </Button>
              </>
            )
            : null
        }
        {
          inProgress
            ? <Loader size="xs" variant="dots" />
            : null
        }
        {
          airdropData
            ? (
              <>
                <Text>Raw deeplink generated</Text>
                <Text fz="xs">
                  1. Your BEET deeplink has been generated, click the button to proceed.
                  <br />
                  2. A BEET prompt will display.
                  <br />
                  3. Verify the prompt&apos;s contents before approving the airdrop.
                </Text>

                <a
                  href={`data:text/json;charset=utf-8,${airdropData}`}
                  download={`airdrop_${chunkItr + 1}.json`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button mt="md">
                    Download airdrop JSON
                  </Button>
                </a>

                <Accordion mt="xs">
                  <Accordion.Item key="json" value="operation_json">
                    <Accordion.Control>
                      Proposed airdrop operation JSON
                    </Accordion.Control>
                    <Accordion.Panel style={{ backgroundColor: '#FAFAFA' }}>
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
            )
            : null
        }
      </Modal>
      {
        accountID.length > 5
          ? <Button mt="md" onClick={open}>Begin airdrop</Button>
          : <Button mt="md" disabled>Begin airdrop</Button>
      }
    </Card>
  );
}
