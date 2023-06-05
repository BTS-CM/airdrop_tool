/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
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

import { airdropStore, appStore, leaderboardStore } from '../lib/states';
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
 * @param {String} env
 * @returns {Object}
 */
async function getAsset(node, searchInput, env) {
  try {
    await Apis.instance(node, true).init_promise;
  } catch (error) {
    console.log(error);
    const { changeURL } = appStore.getState();
    changeURL(env);
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
  const { t, i18n } = useTranslation();
  const params = useParams();

  const btsAirdrops = airdropStore((state) => state.bitshares);
  const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet);
  const tuscAirdrops = airdropStore((state) => state.tusc);

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const [tokenQuantity, onTokenQuantity] = useState(1);
  const [tokenName, onTokenName] = useState("");
  const [accountID, onAccountID] = useState("1.2.x");
  const [tokenDetails, setTokenDetails] = useState();
  const [batchSize, onBatchSize] = useState(50);
  const [distroMethod, setDistroMethod] = useState("Proportionally");
  const [tokenReq, setTokenReq] = useState("no");

  const [requiredToken, onRequiredToken] = useState();
  const [requiredTokenQty, onRequiredTokenQty] = useState();

  const [finalTokenQuantity, setFinalTokenQuantity] = useState(1);
  const [requiredTokenDetails, setRequiredTokenDetails] = useState();
  const [finalReqQty, setFinalReqQty] = useState();


  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[params.env];

  let assetName = "";
  let titleName = "token";
  let relevantChain = "";
  let plannedAirdropData = {};
  let envLeaderboard = [];

  if (params.env === 'bitshares') {
    plannedAirdropData = btsAirdrops.find((x) => params.id === x.id);
    envLeaderboard = btsLeaderboard;
    assetName = "BTS";
    relevantChain = 'BTS';
    titleName = "Bitshares";
  } else if (params.env === 'bitshares_testnet') {
    plannedAirdropData = btsTestnetAirdrops.find((x) => params.id === x.id);
    envLeaderboard = btsTestnetLeaderboard;
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    titleName = "Bitshares (Testnet)";
  } else if (params.env === 'tusc') {
    plannedAirdropData = tuscAirdrops.find((x) => params.id === x.id);
    envLeaderboard = tuscLeaderboard;
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

  // Lookup the token to airdrop
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

  // Quantity of tokens to airdrop
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tokenQuantity && tokenQuantity > 0) {
        setFinalTokenQuantity(tokenQuantity); // store new
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [tokenQuantity]);

  // Optional: Require this token in winner balances
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (requiredToken && requiredToken.length) {
        setRequiredTokenDetails(); // erase last search

        let assetDetails;
        try {
          assetDetails = await getAsset(currentNodes[0], requiredToken);
        } catch (error) {
          console.log(error);
          return;
        }

        if (!assetDetails) {
          return;
        }

        setRequiredTokenDetails({
          id: assetDetails.id,
          symbol: requiredToken,
          precision: assetDetails.precision,
        }); // store new
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [requiredToken]);

  // Optional: Require this many tokens in user balance
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (requiredTokenQty && requiredTokenQty > 0) {
        setFinalReqQty(requiredTokenQty); // store new
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [requiredTokenQty]);

  // Initial winners
  let sortedWinners = plannedAirdropData.calculatedAirdrop.summary.map((winner) => ({
    ...winner,
    balances: envLeaderboard.find((x) => x.id === winner.id).balances,
  })).sort((a, b) => b.qty - a.qty);

  if (tokenReq && tokenReq === 'yes' && requiredToken && finalReqQty && requiredTokenDetails) {
    // Check for mandatory tokens in winner balances
    sortedWinners = sortedWinners.filter((user) => user.balances.map((asset) => asset.asset_id).includes(requiredTokenDetails.id));

    sortedWinners = sortedWinners.filter((user) => {
      const foundAsset = user.balances.find((asset) => asset.asset_id === requiredTokenDetails.id);
      return humanReadableFloat(foundAsset.amount, requiredTokenDetails.precision) >= finalReqQty;
    });
  }

  const ticketQty = sortedWinners
    .map((x) => x.qty)
    .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0);

  let tokenRows = [];
  let remainingTokens = finalTokenQuantity ?? 0;
  const itrQty = distroMethod === "RoundRobin" && finalTokenQuantity
    ? finalTokenQuantity
    : sortedWinners.length;

  for (let i = 0; i < itrQty; i++) {
    if (i === 0) {
      tokenRows = [];
      remainingTokens = finalTokenQuantity;
    }

    if (distroMethod === "Proportionally") {
      tokenRows.push({
        ...sortedWinners[i],
        assignedTokens: ((sortedWinners[i].qty / ticketQty) * finalTokenQuantity),
      });
    } else if (distroMethod === "Equally") {
      tokenRows.push({
        ...sortedWinners[i],
        assignedTokens: ((1 / sortedWinners.length) * finalTokenQuantity),
      });
    } else if (distroMethod === "RoundRobin") {
      let algoItr = i >= sortedWinners.length
        ? Math.round(((i / sortedWinners.length) % 1) * sortedWinners.length)
        : i;

      if (remainingTokens < 1) {
        // No more to allocate
        break;
      }

      remainingTokens -= 1;

      const currentWinner = sortedWinners[algoItr];
      console.log({currentWinner, algoItr})
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
  if (!tokenDetails || (requiredToken && finalReqQty && !requiredTokenDetails)) {
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
                  tokenReq && tokenReq === 'yes' && requiredToken && finalReqQty && !requiredTokenDetails
                    ? (
                      <>
                        <Loader variant="dots" />
                        <Text size="md">
                          Processing user balances for required token
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
                    <TextInput
                      type="number"
                      withAsterisk
                      placeholder={tokenQuantity}
                      label="Enter the quantity of tokens you wish to airdrop"
                      style={{ maxWidth: '400px', marginTop: '10px' }}
                      onChange={
                        (event) => {
                          onTokenQuantity(
                            parseFloat(event.currentTarget.value)
                          );
                        }
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
                    <Radio.Group
                      value={tokenReq}
                      onChange={setTokenReq}
                      name="tokenReq"
                      label="Introduce additional token requirement?"
                      style={{ marginTop: '10px' }}
                      withAsterisk
                    >
                      <Group mt="xs">
                        <Radio value="yes" label="Yes" />
                        <Radio value="no" label="No" />
                      </Group>
                    </Radio.Group>
                    {
                      tokenReq && tokenReq === "yes"
                        ? (
                          <>
                            <TextInput
                              type="string"
                              withAsterisk
                              placeholder={requiredToken}
                              label="Provide the required token's symbol"
                              style={{ maxWidth: '400px', marginTop: '10px' }}
                              onChange={
                                (event) => onRequiredToken(
                                  event.currentTarget.value
                                )
                              }
                            />
                            <TextInput
                              type="number"
                              withAsterisk
                              placeholder={requiredTokenQty}
                              label="Provide the quantity of required tokens"
                              style={{ maxWidth: '400px', marginTop: '10px' }}
                              onChange={
                                (event) => onRequiredTokenQty(
                                  parseFloat(event.currentTarget.value)
                                )
                              }
                            />
                          </>
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
                            {`With a batch limit of ${batchSize}, ${validRows.length / batchSize < 1 ? 1 : Math.ceil(validRows.length / batchSize)} ${validRows.length / batchSize < 1 ? "batch is" : "batches are"} required to complete this airdrop.`}
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
