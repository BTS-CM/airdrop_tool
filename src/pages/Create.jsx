/* eslint-disable max-len */
import React, { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";
import { useTranslation } from 'react-i18next';
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
  Badge,
} from '@mantine/core';
import { Link, useParams } from "react-router-dom";

import { leaderboardStore, appStore } from '../lib/states';
import DeepLink from '../lib/DeepLink';

export default function Create(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const [value, setValue] = useState(
    (params && params.env) ?? 'bitshares'
  );
  const [ticketType, setTicketType] = useState("lock_180_days");
  const [beetType, setBeetType] = useState();
  const [deepLink, setDeepLink] = useState();
  const [accountID, onAccountID] = useState((params && params.id) ?? "1.2.x");

  const [tokenQuantity, onTokenQuantity] = useState(1);
  const [opened, { open, close }] = useDisclosure(false);

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[value];

  let relevantChain = "bitshares";
  let assetName = "1.3.0";
  let leaderboardJSON = [];
  let currentlyLocked = 0;

  if (value === 'bitshares') {
    leaderboardJSON = btsLeaderboard;
    currentlyLocked = btsLeaderboard
      .reduce((accumulator, entry) => accumulator + parseInt(entry.amount, 10), 0);
    assetName = "BTS";
    relevantChain = 'BTS';
  } else if (value === 'bitshares_testnet') {
    leaderboardJSON = btsTestnetLeaderboard;
    currentlyLocked = btsTestnetLeaderboard
      .reduce((accumulator, entry) => accumulator + parseInt(entry.amount, 10), 0);
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
  } else if (value === 'tusc') {
    leaderboardJSON = tuscLeaderboard;
    currentlyLocked = tuscLeaderboard
      .reduce((accumulator, entry) => accumulator + parseInt(entry.amount, 10), 0);
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

  async function generateDeepLink() {
    const beetLink = new DeepLink(
      'Airdrop tool creating ticket',
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
      return;
    }

    const tr = new TXBuilder();
    tr.add_type_operation(
      'ticket_create',
      {
        account: accountID,
        target_type: targetType,
        amount: {
          amount: tokenQuantity * 100000,
          asset_id: "1.3.0",
        },
        extensions: [],
      },
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

    setDeepLink(`rawbeet://api?chain=${relevantChain}&request=${encryptedPayload}`);
  }

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
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
          style={{ marginTop: '20px' }}
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
          style={{ maxWidth: '300px', marginTop: '20px' }}
          onChange={(event) => onTokenQuantity(event.currentTarget.value)}
        />

        <Text fz="md" style={{ marginTop: '15px' }}>
          By locking
          {' '}
          {tokenQuantity}
          {' '}
          {assetName}
          {' '}
          your ticket will be equivalent to
          {' '}
          {tokenLockValue}
          {' '}
          {assetName}
          {' '}
          in terms of voting and airdrop surface area.
        </Text>

        <Modal
          opened={opened}
          onClose={() => {
            setBeetType();
            setDeepLink();
            close();
          }}
          title="Creating a ticket"
        >
          {
                    !deepLink
                      ? (
                        <>
                          <Text>Via raw Beet deeplink</Text>
                          <Text m="sm" fz="xs">
                            1. Launch the BEET wallet and navigate to &quot;Raw Link&quot; in the menu.
                            <br />
                            2. From this page you can either allow all operations, or solely allow operation 57 &quot;Ticket create&quot; (then click save).
                            <br />
                            3. Once &quot;Ready for raw links&quot; shows in Beet submit this request.
                          </Text>
                          <TextInput
                            type="string"
                            placeholder={accountID}
                            m="sm"
                            label={`Enter your ${value} account ID`}
                            style={{ maxWidth: '300px' }}
                            onChange={(event) => onAccountID(event.currentTarget.value)}
                          />
                          {
                                accountID !== "1.2.x" && accountID.length > 4
                                  ? (
                                    <Button m="xs" onClick={async () => await generateDeepLink()}>
                                      Generate raw deeplink
                                    </Button>
                                  )
                                  : (
                                    <Button m="xs" disabled>
                                      Generate raw deeplink
                                    </Button>
                                  )
                            }
                        </>
                      )
                      : null
                }
          {
                    deepLink
                      ? (
                        <>
                          <Text>Raw deeplink generated</Text>
                          <Text fz="xs">
                            1. Your BEET deeplink has been generated, click the button to proceed.
                            <br />
                            2. A BEET prompt will display, verify the contents then approve the create ticket prompt.
                            <br />
                            3. Go to the &quot;Fetch tickets&quot; page to download your ticket for analysis.
                          </Text>
                          <a href={deepLink}>
                            <Button m="xs">
                              Broadcast to BEET
                            </Button>
                          </a>
                          <Button
                            m="xs"
                            onClick={() => {
                              setDeepLink();
                            }}
                          >
                            Back
                          </Button>
                        </>
                      )
                      : null
                }
        </Modal>

        <Group position="center">
          <Button style={{ marginTop: '20px' }} onClick={open}>Ask BEET to create ticket</Button>
        </Group>
      </Card>

      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={5} ta="center" mt="xs">
          As a result of creating this ticket, the top 10 leaderboard stats will change as such
        </Title>
        <Table miw={800} verticalSpacing="sm" mt="md">
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Amount</th>
              <th align="left">Before</th>
              <th align="left">After</th>
            </tr>
          </thead>
          <tbody>
            {
                        leaderboardJSON.slice(0, 10).map((leader) => (
                          <tr key={leader.id}>
                            <td>{leader.id}</td>
                            <td>{leader.amount}</td>
                            <td>
                              {leader.percent.toFixed(2)}
                              {' '}
                              %
                            </td>
                            <td>
                              {((leader.amount / (currentlyLocked + tokenLockValue)) * 100).toFixed(2)}
                              {' '}
                              %
                            </td>
                          </tr>
                        ))
                    }
          </tbody>
        </Table>
      </Card>

    </>
  );
}
