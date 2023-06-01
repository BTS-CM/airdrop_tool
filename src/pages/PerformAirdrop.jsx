/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
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
  NumberInput,
  JsonInput,
  Loader,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

import {
  HiOutlineEmojiSad,
  HiOutlineEmojiHappy,
  HiOutlineShieldExclamation,
  HiOutlineShieldCheck,
} from "react-icons/hi";

import { airdropStore, appStore } from '../lib/states';
import DeepLink from '../lib/DeepLink';
import AirdropCard from './AirdropCard';

function sliceIntoChunks(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Convert the token's blockchain representation into a human readable quantity
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function humanReadableFloat(satoshis, precision) {
  return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

/**
 * Convert human readable quantity into the token's blockchain representation
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function blockchainFloat(satoshis, precision) {
  return satoshis * 10 ** precision;
}

/**
 * Retrieve the details of an asset from the blockchain
 * @param {String} node
 * @param {String} searchInput
 * @returns {Object}
 */
async function getAsset(node, searchInput) {
  try {
    await Apis.instance(node, true).init_promise;
  } catch (error) {
    console.log(error);
    const { changeURL } = appStore.getState();
    changeURL();
    return;
  }

  let symbols;
  try {
    symbols = await Apis.instance()
      .db_api()
      .exec('lookup_asset_symbols', [[searchInput]]);
  } catch (error) {
    console.log(error);
    return;
  }

  const filteredSymbols = symbols.filter((x) => x !== null);
  if (!filteredSymbols || !filteredSymbols.length) {
    console.log("No results");
    return;
  }

  return filteredSymbols[0];
}

export default function PerformAirdrop(properties) {
  const params = useParams();

  const btsAirdrops = airdropStore((state) => state.bitshares);
  const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet);
  const tuscAirdrops = airdropStore((state) => state.tusc);

  const [tokenQuantity, onTokenQuantity] = useState(1);
  const [tokenName, onTokenName] = useState("");
  const [accountID, onAccountID] = useState("1.2.x");
  const [tokenDetails, setTokenDetails] = useState();
  const [batchSize, onBatchSize] = useState(50);
  const [distroMethod, setDistroMethod] = useState("Proportionally");

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[params.env];

  let assetName = "";
  let titleName = "token";
  let relevantChain = "";
  let plannedAirdropData = {};

  if (params.env === 'bitshares') {
    plannedAirdropData = btsAirdrops.find((x) => params.id === x.id);
    assetName = "BTS";
    relevantChain = 'BTS';
    titleName = "Bitshares";
  } else if (params.env === 'bitshares_testnet') {
    plannedAirdropData = btsTestnetAirdrops.find((x) => params.id === x.id);
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    titleName = "Bitshares (Testnet)";
  } else if (params.env === 'tusc') {
    plannedAirdropData = tuscAirdrops.find((x) => params.id === x.id);
    assetName = "TUSC";
    relevantChain = 'TUSC';
    titleName = "TUSC";
  }

  useEffect(() => {
    if (params.env === 'bitshares') {
      onTokenName("BTS");
    } else if (params.env === 'bitshares_testnet') {
      onTokenName("TEST");
    } else if (params.env === 'tusc') {
      onTokenName("TUSC");
    }
  }, []);

  const winners = plannedAirdropData.calculatedAirdrop.summary;
  const ticketQty = winners
    .map((x) => x.qty)
    .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0);

  const sortedWinners = winners.sort((a, b) => b.qty - a.qty);
  let tokenRows = [];
  let remainingTokens = 0;
  for (let i = 0; i < sortedWinners.length; i++) {
    if (i === 0) {
      tokenRows = [];
      remainingTokens = tokenQuantity;
    }

    if (distroMethod === "Proportionally") {
      tokenRows.push({
        ...sortedWinners[i],
        assignedTokens: ((sortedWinners[i].qty / ticketQty) * tokenQuantity),
      });
    } else if (distroMethod === "Equally") {
      tokenRows.push({
        ...sortedWinners[i],
        assignedTokens: ((1 / sortedWinners.length) * tokenQuantity),
      });
    } else if (distroMethod === "RoundRobin") {
      if (i === sortedWinners.length - 1) {
        // loop back around
        i = 0;
      }

      if (remainingTokens < 1) {
        // No more to allocate
        break;
      }

      remainingTokens -= 1;

      const currentWinner = sortedWinners[i];
      let existingRow = tokenRows.find((x) => currentWinner.id === x.id);
      if (!existingRow) {
        tokenRows.push({
          ...currentWinner, assignedTokens: 1,
        });
        continue;
      }

      const filteredRows = tokenRows.filter((x) => x.id !== currentWinner.id);
      existingRow = { ...existingRow, assignedTokens: existingRow.assignedTokens + 1 };
      filteredRows.push(existingRow);
      tokenRows = filteredRows;
    }
  }

  let validRows = [];
  let invalidRows = [];
  let winnerChunks = [];
  if (!tokenDetails) {
    validRows = [];
    invalidRows = [];
    winnerChunks = [];
  } else {
    const valid = tokenRows
      .sort((a, b) => b.assignedTokens - a.assignedTokens)
      .filter((user) => user.assignedTokens > humanReadableFloat(1, tokenDetails.precision) || (tokenDetails.precision === 0 && tokenDetails.readableMax === 1 && parseFloat(user.assignedTokens) === 1));

    winnerChunks = valid.length
      ? sliceIntoChunks(valid.sort((a, b) => b.qty - a.qty), batchSize)
      : [];

    validRows = valid.length
      ? valid
        .map((winner) => (
          <tr key={winner.id}>
            <td>
              <Link style={{ textDecoration: 'none' }} to={`/Account/${params.env}/${winner.id}`}>
                {winner.id}
              </Link>
            </td>
            <td>
              {winner.qty}
            </td>
            <td>
              { winner.assignedTokens.toFixed(tokenDetails.precision) }
              {' '}
              {tokenName || assetName}
            </td>
          </tr>
        ))
      : null;

    invalidRows = tokenRows
      .filter((user) => user.assignedTokens < humanReadableFloat(1, tokenDetails.precision) || (tokenDetails.precision === 0 && tokenDetails.readableMax === 1 && parseFloat(user.assignedTokens) < 1))
      .map((loser) => (
        <tr key={loser.id}>
          <td>
            <Link style={{ textDecoration: 'none' }} to={`/Account/${params.env}/${loser.id}`}>
              {loser.id}
            </Link>
          </td>
          <td>
            {loser.qty}
          </td>
          <td>
            0
            {' '}
            {tokenName || assetName}
          </td>
        </tr>
      ));
  }

  const airdropCards = winnerChunks && winnerChunks.length
    ? winnerChunks.map((chunk, i) => (
      <AirdropCard
        tokenQuantity={tokenQuantity}
        tokenName={tokenName}
        distroMethod={distroMethod}
        accountID={accountID}
        chunk={chunk}
        chunkItr={i}
        winnerChunkQty={winnerChunks.length}
        quantityWinners={validRows.length}
        env={params.env}
        ticketQty={ticketQty}
        key={`airdrop_card_${i}`}
        tokenDetails={tokenDetails}
      />
    ))
    : [];

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tokenName && tokenName.length) {
        setTokenDetails(); // erase last search

        let assetDetails;
        try {
          assetDetails = await getAsset(currentNodes[0], tokenName);
        } catch (error) {
          console.log(error);
          return;
        }

        if (!assetDetails) {
          return;
        }

        setTokenDetails({
          id: assetDetails.id,
          precision: assetDetails.precision,
          max_supply: assetDetails.options.max_supply,
          readableMax: humanReadableFloat(assetDetails.options.max_supply, assetDetails.precision),
        }); // store new
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [tokenName]);

  return (
    <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
      <Title order={2} ta="center" mt="sm">
        Perform airdrop on the
        {' '}
        {titleName}
        {' '}
        blockchain
        <br />
        <Link to={`/PlannedAirdrop/${params.env}/${params.id}`}>
          <Button compact>
            Airdrop summary
          </Button>
        </Link>
        <Link to="/CalculatedAirdrops">
          <Button ml="sm" compact>
            Calculated airdrops
          </Button>
        </Link>
      </Title>

      {
                !plannedAirdropData
                  ? <Text>Ticket not found</Text>
                  : (
                    <SimpleGrid cols={2} spacing="sm" mt={10} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
                      <Card shadow="md" radius="md" padding="xl" mt={20}>
                        {
                                !tokenDetails
                                  ? (
                                    <>
                                      <Loader variant="dots" />
                                      <Text size="md">
                                        Loading asset data
                                      </Text>
                                    </>
                                  )
                                  : null
                            }
                        {
                                validRows && validRows.length
                                  ? (
                                    <>
                                      <Text>
                                        <HiOutlineEmojiHappy />
                                        {' '}
                                        Ticket holders included in airdrop
                                      </Text>
                                      <Table highlightOnHover>
                                        <thead>
                                          <tr>
                                            <th>id</th>
                                            <th>Quantity</th>
                                            <th>Allocated tokens</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {validRows}
                                        </tbody>
                                      </Table>
                                    </>
                                  )
                                  : null
                            }

                        {
                                invalidRows && invalidRows.length
                                  ? (
                                    <>
                                      <Text mt="md">
                                        <HiOutlineEmojiSad />
                                        {' '}
                                        Disqualified from airdrop
                                      </Text>
                                      <Text c="dimmed" mb="sm">
                                        Unable to include the following ticket holders in airdrops.
                                      </Text>
                                      <Table style={{ backgroundColor: 'dimmed' }}>
                                        <thead>
                                          <tr>
                                            <th>id</th>
                                            <th>Quantity</th>
                                            <th>Reward</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {invalidRows}
                                        </tbody>
                                      </Table>
                                    </>
                                  )
                                  : null
                            }

                      </Card>
                      <Card>
                        <SimpleGrid cols={1} spacing="sm">
                          <Card shadow="md" radius="md" padding="xl">
                            <Text fz="lg" fw={500} mt="xs">
                              Airdrop summary
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                              ID: {plannedAirdropData.id}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                              Hash: {plannedAirdropData.hash}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                              Deduplicated: {plannedAirdropData.deduplicate}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                              Only winning tickets: {plannedAirdropData.alwaysWinning}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                              Blocknumber: {plannedAirdropData.blockNumber}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                              Algorithms: {plannedAirdropData.algos.join(", ")}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                              Winners: {plannedAirdropData.calculatedAirdrop.summary.length}
                            </Text>
                            <Text fz="sm" c="dimmed" mt="xs">
                              Winning ticket qty: {ticketQty}
                            </Text>
                          </Card>
                          <Card shadow="md" radius="md" padding="sm">
                            <Text fz="lg" fw={600} mt="md">
                              Airdrop options
                            </Text>
                            <TextInput
                              type="string"
                              withAsterisk
                              placeholder={accountID}
                              label={`Enter your ${titleName} account ID`}
                              style={{ maxWidth: '400px' }}
                              onChange={(event) => onAccountID(event.currentTarget.value)}
                            />
                            <TextInput
                              type="string"
                              withAsterisk
                              placeholder={tokenName || assetName}
                              label="Enter the name of the asset you wish to airdrop"
                              style={{ maxWidth: '400px', marginTop: '10px' }}
                              onChange={(event) => onTokenName(event.currentTarget.value)}
                            />
                            <TextInput
                              type="number"
                              withAsterisk
                              placeholder={batchSize}
                              label="Size of airdrop transfer batches"
                              style={{ maxWidth: '400px', marginTop: '10px' }}
                              onChange={
                                (event) => onBatchSize(parseInt(event.currentTarget.value, 10))
                              }
                            />
                            <Radio.Group
                              value={distroMethod}
                              onChange={setDistroMethod}
                              name="distroMethod"
                              label="How should tokens be allocated to winners?"
                              style={{ marginTop: '10px' }}
                              withAsterisk
                            >
                              <Group mt="xs">
                                <Radio value="Equally" label="Equally between winning account IDs" />
                                <Radio value="Proportionally" label="Proportional to tickets won" />
                                <Radio value="RoundRobin" label="Allocate whole tokens in a round robin manner" />
                              </Group>
                            </Radio.Group>

                            {
                                        distroMethod !== "RoundRobin"
                                          ? (
                                            <TextInput
                                              type="number"
                                              withAsterisk
                                              placeholder={tokenQuantity}
                                              label="Enter the quantity of tokens you wish to airdrop"
                                              style={{ maxWidth: '400px', marginTop: '10px' }}
                                              onChange={
                                                (event) => onTokenQuantity(
                                                  parseFloat(event.currentTarget.value)
                                                )
                                              }
                                            />
                                          )
                                          : null
                                    }

                            {
                                        distroMethod === "RoundRobin"
                                          ? (
                                            <NumberInput
                                              mt="sm"
                                              withAsterisk
                                              min={0}
                                              max={10000000000000}
                                              label="Enter the quantity of tokens you wish to airdrop"
                                              value={tokenQuantity}
                                              onChange={onTokenQuantity}
                                            />
                                          )
                                          : null
                                    }

                          </Card>
                          {
                            !validRows || !validRows.length
                              ? (
                                <Card shadow="md" radius="md" padding="sm" style={{ backgroundColor: '#FAFAFA' }}>
                                  <Text fz="lg" fw={500} mt="md">
                                    <HiOutlineShieldExclamation />
                                    {' '}
                                    Nothing to airdrop
                                  </Text>
                                  <Text fz="sm" c="dimmed" mt="xs">
                                    Given there are no valid tickets, there&apos;s nothing to airdrop.
                                  </Text>
                                  <Text fz="sm" c="dimmed" mt="xs">
                                    Adjust the airdrop settings or calculate another airdrop to proceed.
                                  </Text>
                                </Card>
                              )
                              : (
                                <Card shadow="md" radius="md" padding="sm" style={{ backgroundColor: '#FAFAFA' }}>
                                  <Text fz="lg" fw={500} mt="md">
                                    <HiOutlineShieldCheck />
                                    {' '}
                                    Proceed with airdrop?
                                  </Text>
                                  <Text fz="sm" c="dimmed" mt="xs">
                                    With a batch limit of
                                    {' '}
                                    {batchSize}
                                    ,
                                    {validRows.length / batchSize < 1 ? 1 : Math.ceil(validRows.length / batchSize)}
                                    {' '}
                                    {validRows.length / batchSize < 1 ? "batch is" : "batches are"}
                                    {' '}
                                    required to complete this airdrop.
                                  </Text>
                                  <Text fz="sm" c="dimmed" mt="xs">
                                    Keep in mind the transaction and block size limits when planning batches of airdrops.
                                  </Text>
                                  {
                                            airdropCards
                                        }
                                </Card>
                              )
                          }
                        </SimpleGrid>
                      </Card>
                    </SimpleGrid>
                  )
            }
    </Card>
  );
}
