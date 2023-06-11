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
import { Apis } from "bitsharesjs-ws";

import {
  HiOutlineEmojiSad,
  HiOutlineEmojiHappy,
  HiOutlineShieldExclamation,
  HiOutlineShieldCheck,
} from "react-icons/hi";

import { airdropStore, appStore, leaderboardStore } from '../lib/states';
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
  const [myID, setMyID] = useState();
  const [tokenDetails, setTokenDetails] = useState();
  const [batchSize, onBatchSize] = useState(50);
  const [distroMethod, setDistroMethod] = useState("Proportionally");
  const [ltmReq, setLTMReq] = useState("no");
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setMyID();
      if (accountID && accountID.length && accountID.length > 4 && accountID.includes("1.2.")) {
        setMyID(accountID);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [accountID]);

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

  if (ltmReq && ltmReq === 'yes') {
    // Filter out non LTM users from airdrop
    sortedWinners = sortedWinners.filter((user) => {
      const id = user.id;
      const ltm = envLeaderboard.find((x) => x.id === user.id).account.ltm;
      return ltm ? true : false;
    })
  }

  if (myID) {
    // User provided their ID -> filter their id from airdrop!
    sortedWinners = sortedWinners.filter((user) => user.id !== myID);
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
  let winnerChunks = [];
  if (!tokenDetails || (requiredToken && finalReqQty && !requiredTokenDetails)) {
    validRows = [];
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
        {t("performAirdrop:header.title", { titleName })}
        <br />
        <Link to={`/PlannedAirdrop/${params.env}/${params.id}`}>
          <Button compact>
            {t("performAirdrop:header.back")}
          </Button>
        </Link>
        <Link to="/CalculatedAirdrops">
          <Button ml="sm" compact>
            {t("performAirdrop:header.others")}
          </Button>
        </Link>
      </Title>

      {
        !plannedAirdropData
          ? <Text>{t("performAirdrop:noTicket")}</Text>
          : (
            <SimpleGrid cols={2} spacing="sm" mt={10} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
              <Card shadow="md" radius="md" padding="xl" mt={20}>
                {
                  !tokenDetails
                    ? (
                      <>
                        <Loader variant="dots" />
                        <Text size="md">
                          {t("performAirdrop:grid.left.loading")}
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
                          {t("performAirdrop:grid.left.processing")}
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
                          {t("performAirdrop:grid.left.table.title")}
                        </Text>
                        <Table highlightOnHover>
                          <thead>
                            <tr>
                              <th>{t("performAirdrop:grid.left.table.th1")}</th>
                              <th>{t("performAirdrop:grid.left.table.th2")}</th>
                              <th>{t("performAirdrop:grid.left.table.th3")}</th>
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
              </Card>
              <Card>
                <SimpleGrid cols={1} spacing="sm">
                  <Card shadow="md" radius="md" padding="xl">
                    <Text fz="lg" fw={500} mt="xs">
                      {t("performAirdrop:grid.right.summary.title")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.id")}: {plannedAirdropData.id}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.hash")}: {plannedAirdropData.hash}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.dedupe")}: {plannedAirdropData.deduplicate}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.onlyWins")}: {plannedAirdropData.alwaysWinning}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.blockno")}: {plannedAirdropData.blockNumber}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.algos")}: {plannedAirdropData.algos.join(", ")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.winners")}: {plannedAirdropData.calculatedAirdrop.summary.length}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.ticketWinQty")}: {ticketQty}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="sm">
                    <Text fz="lg" fw={600} mt="md">
                      {t("performAirdrop:grid.right.options.title")}
                    </Text>
                    <TextInput
                      type="string"
                      withAsterisk
                      placeholder={accountID}
                      label={t("performAirdrop:grid.right.options.titleName", { titleName })}
                      style={{ maxWidth: '400px' }}
                      onChange={(event) => onAccountID(event.currentTarget.value)}
                    />
                    <TextInput
                      type="string"
                      withAsterisk
                      placeholder={tokenName || assetName}
                      label={t("performAirdrop:grid.right.options.assetName")}
                      style={{ maxWidth: '400px', marginTop: '10px' }}
                      onChange={(event) => onTokenName(event.currentTarget.value)}
                    />
                    <TextInput
                      type="number"
                      withAsterisk
                      placeholder={batchSize}
                      label={t("performAirdrop:grid.right.options.batchSize")}
                      style={{ maxWidth: '400px', marginTop: '10px' }}
                      onChange={
                        (event) => onBatchSize(parseInt(event.currentTarget.value, 10))
                      }
                    />
                    <TextInput
                      type="number"
                      withAsterisk
                      placeholder={tokenQuantity}
                      label={t("performAirdrop:grid.right.options.tokenQuantity")}
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
                      label={t("performAirdrop:grid.right.options.distroRadio.title")}
                      style={{ marginTop: '10px' }}
                      withAsterisk
                    >
                      <Group mt="xs">
                        <Radio
                          value="Equally"
                          label={t("performAirdrop:grid.right.options.distroRadio.equally")}
                        />
                        <Radio
                          value="Proportionally"
                          label={t("performAirdrop:grid.right.options.distroRadio.proportionally")}
                        />
                        <Radio
                          value="RoundRobin"
                          label={t("performAirdrop:grid.right.options.distroRadio.roundRobin")}
                        />
                      </Group>
                    </Radio.Group>
                    <Radio.Group
                      value={ltmReq}
                      onChange={setLTMReq}
                      name="ltmReq"
                      label={t("performAirdrop:grid.right.options.ltm.title")}
                      style={{ marginTop: '10px' }}
                      withAsterisk
                    >
                      <Group mt="xs">
                        <Radio
                          value="yes"
                          label={t("performAirdrop:grid.right.options.reqRadio.yes")}
                        />
                        <Radio
                          value="no"
                          label={t("performAirdrop:grid.right.options.reqRadio.no")}
                        />
                      </Group>
                    </Radio.Group>
                    <Radio.Group
                      value={tokenReq}
                      onChange={setTokenReq}
                      name="tokenReq"
                      label={t("performAirdrop:grid.right.options.reqRadio.title")}
                      style={{ marginTop: '10px' }}
                      withAsterisk
                    >
                      <Group mt="xs">
                        <Radio
                          value="yes"
                          label={t("performAirdrop:grid.right.options.reqRadio.yes")}
                        />
                        <Radio
                          value="no"
                          label={t("performAirdrop:grid.right.options.reqRadio.no")}
                        />
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
                              label={t("performAirdrop:grid.right.options.reqRadio.requiredToken")}
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
                              label={t("performAirdrop:grid.right.options.reqRadio.requiredTokenQty")}
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
                            {t("performAirdrop:grid.right.invalid.title")}
                          </Text>
                          <Text fz="sm" c="dimmed" mt="xs">
                            {t("performAirdrop:grid.right.invalid.reason")}
                          </Text>
                          <Text fz="sm" c="dimmed" mt="xs">
                            {t("performAirdrop:grid.right.invalid.resolution")}
                          </Text>
                        </Card>
                      )
                      : (
                        <Card shadow="md" radius="md" padding="sm" style={{ backgroundColor: '#FAFAFA' }}>
                          <Text fz="lg" fw={500} mt="md">
                            <HiOutlineShieldCheck />
                            {' '}
                            {t("performAirdrop:grid.right.valid.title")}
                          </Text>
                          <Text fz="sm" c="dimmed" mt="xs">
                            {
                              validRows.length / batchSize < 1
                                ? t("performAirdrop:grid.right.valid.single", { batchSize })
                                : t("performAirdrop:grid.right.valid.multi", { batchSize, qtyBatches: Math.ceil(validRows.length / batchSize) })
                            }
                          </Text>
                          <Text fz="sm" c="dimmed" mt="xs">
                            {t("performAirdrop:grid.right.valid.reminder")}
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
