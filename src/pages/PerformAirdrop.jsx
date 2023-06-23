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
import _ from "lodash";

import {
  HiOutlineShieldExclamation,
  HiOutlineShieldCheck,
} from "react-icons/hi";

import {
  airdropStore,
  appStore,
  leaderboardStore,
  beetStore,
  tempStore,
  assetStore,
  blocklistStore,
} from "../lib/states";

import AirdropCard from "./AirdropCard";
import GetAccount from "./GetAccount";
import { lookupSymbols } from "../lib/directQueries";
import { sliceIntoChunks, humanReadableFloat } from '../lib/common';

export default function PerformAirdrop(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const btsAirdrops = airdropStore((state) => state.bitshares);
  const btsTestnetAirdrops = airdropStore((state) => state.bitshares_testnet);
  const tuscAirdrops = airdropStore((state) => state.tusc);
  const updateOne = airdropStore((state) => state.updateOne);

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const btsBlockedAccounts = blocklistStore((state) => state.bitshares);
  const btsTestnetBlockedAccounts = blocklistStore((state) => state.bitshares_testnet);
  const tuscBlockedAccounts = blocklistStore((state) => state.tusc);

  const btsAssets = assetStore((state) => state.bitshares);
  const btsTestnetAssets = assetStore((state) => state.bitshares_testnet);
  const tuscAssets = assetStore((state) => state.tusc);
  const addOne = assetStore((state) => state.addOne);

  let assetName = "";
  let titleName = "token";
  let relevantChain = "";
  let plannedAirdropData = {};
  let envLeaderboard = [];
  let cachedAssets = [];
  let blockList = [];

  if (params.env === 'bitshares') {
    plannedAirdropData = btsAirdrops.find((x) => params.id === x.id);
    envLeaderboard = btsLeaderboard;
    assetName = "BTS";
    relevantChain = 'BTS';
    titleName = "Bitshares";
    cachedAssets = btsAssets;
    blockList = btsBlockedAccounts;
  } else if (params.env === 'bitshares_testnet') {
    plannedAirdropData = btsTestnetAirdrops.find((x) => params.id === x.id);
    envLeaderboard = btsTestnetLeaderboard;
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    titleName = "Bitshares (Testnet)";
    cachedAssets = btsTestnetAssets;
    blockList = btsTestnetBlockedAccounts;
  } else if (params.env === 'tusc') {
    plannedAirdropData = tuscAirdrops.find((x) => params.id === x.id);
    envLeaderboard = tuscLeaderboard;
    assetName = "TUSC";
    relevantChain = 'TUSC';
    titleName = "TUSC";
    cachedAssets = tuscAssets;
    blockList = tuscBlockedAccounts;
  }

  // Beet
  const changeURL = appStore((state) => state.changeURL);
  const identity = beetStore((state) => state.identity);
  const account = tempStore((state) => state.account);
  const [inProgress, setInProgress] = useState(false);

  // Radio buttons
  const [distroMethod, setDistroMethod] = useState(plannedAirdropData.settings.distroMethod ?? 'No');
  const [blocking, setBlocking] = useState(plannedAirdropData.settings.blocking ?? 'No');
  const [ltmReq, setLTMReq] = useState(plannedAirdropData.settings.ltmReq ?? 'No');
  const [tokenReq, setTokenReq] = useState(plannedAirdropData.settings.tokenReq ?? 'No');

  // Debounced input
  const [tokenName, onTokenName] = useState(plannedAirdropData.settings.tokenName ?? assetName);
  const [tokenQuantity, onTokenQuantity] = useState(plannedAirdropData.settings.tokenQuantity ?? 1);
  const [batchSize, onBatchSize] = useState(plannedAirdropData.settings.batchSize ?? 50);

  const [requiredToken, onRequiredToken] = useState(plannedAirdropData.settings.requiredToken ?? 'No');
  const [requiredTokenQty, onRequiredTokenQty] = useState(plannedAirdropData.settings.requiredTokenQty ?? 1);

  // Retrieved asset info
  const [tokenDetails, setTokenDetails] = useState();
  const [requiredTokenDetails, setRequiredTokenDetails] = useState();

  // Debounced output
  const [finalTokenName, setFinalTokenName] = useState("");
  const [finalTokenQuantity, setFinalTokenQuantity] = useState(1);
  const [finalReqTokenName, setFinalReqTokenName] = useState();
  const [finalReqQty, setFinalReqQty] = useState();
  const [finalBatchSize, setFinalBatchSize] = useState();

  // Refresh iterators
  const [tokenItr, setTokenItr] = useState(0);
  const [reqdTokenItr, setReqdTokenItr] = useState(0);

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[params.env];

  useEffect(() => {
    if (
      finalTokenName
      && finalBatchSize
      && finalTokenQuantity
      && distroMethod
      && blocking
      && ltmReq
      && tokenReq
      && finalReqTokenName
      && finalReqQty
    ) {
      const currentSettings = plannedAirdropData.settings;
      const newSettings = {
        tokenName: finalTokenName,
        batchSize: finalBatchSize,
        tokenQuantity: finalTokenQuantity,
        distroMethod,
        blocking,
        ltmReq,
        tokenReq,
        requiredToken: finalReqTokenName,
        requiredTokenQty: finalReqQty
      };

      if (!_.isEqual(currentSettings, newSettings)) {
        updateOne(
          params.env,
          params.id,
          newSettings
        );
      }
    }
  }, [
    distroMethod,
    blocking,
    ltmReq,
    tokenReq,
    finalTokenName,
    finalReqTokenName,
    finalTokenQuantity,
    finalBatchSize,
    finalReqQty
  ]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tokenName && tokenName.length) {
        setFinalTokenName(tokenName);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [tokenName]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (batchSize && batchSize > 0) {
        setFinalBatchSize(batchSize);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [batchSize]);

  // Lookup the token to airdrop
  useEffect(() => {
    async function fetchAirdropDetails() {
      const delayDebounceFn = setTimeout(async () => {
        if (finalTokenName && finalTokenName.length) {
          setTokenDetails(); // erase last search
          setInProgress(true);

          const foundCachedAsset = cachedAssets.find((asset) => asset.symbol === finalTokenName);
          if (foundCachedAsset) {
            setTokenDetails({
              id: foundCachedAsset.id,
              precision: foundCachedAsset.precision,
              max_supply: foundCachedAsset.options.max_supply,
              readableMax: humanReadableFloat(
                foundCachedAsset.options.max_supply,
                foundCachedAsset.precision
              ),
            });
            setInProgress(false);
            return;
          }

          let assetDetails;
          try {
            assetDetails = await lookupSymbols(currentNodes[0], params.env, [finalTokenName]);
          } catch (error) {
            console.log(error);
            changeURL(params.env);
            setInProgress(false);
            return;
          }

          if (!assetDetails || !assetDetails.length) {
            setInProgress(false);
            return;
          }

          const assetData = assetDetails.map((q) => ({
            id: q.id,
            symbol: q.symbol,
            precision: q.precision,
            issuer: q.issuer,
            options: {
              max_supply: q.options.max_supply
            },
            dynamic_asset_data_id: q.dynamic_asset_data_id
          }));

          addOne(params.env, assetData[0]);

          setTokenDetails({
            id: assetDetails[0].id,
            precision: assetDetails[0].precision,
            max_supply: assetDetails[0].options.max_supply,
            readableMax: humanReadableFloat(
              assetDetails[0].options.max_supply,
              assetDetails[0].precision
            ),
          }); // store new

          setInProgress(false);
        }
      }, 1000);

      return () => clearTimeout(delayDebounceFn);
    }

    fetchAirdropDetails();
  }, [finalTokenName, tokenItr]);

  // Quantity of tokens to airdrop
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tokenQuantity && tokenQuantity > 0) {
        setFinalTokenQuantity(tokenQuantity); // store new
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [tokenQuantity]);

  // Optional: Require this asset in the user balance
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (requiredToken && requiredToken !== "") {
        setFinalReqTokenName(requiredToken); // store new
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

  useEffect(() => {
    async function fetchTokenDetails() {
      const delayDebounceFn = setTimeout(async () => {
        if (finalReqTokenName && finalReqTokenName.length) {
          setRequiredTokenDetails(); // erase last search
          setInProgress(true);

          const foundCachedAsset = cachedAssets.find((asset) => asset.symbol === finalReqTokenName);
          if (foundCachedAsset) {
            setRequiredTokenDetails({
              id: foundCachedAsset.id,
              symbol: finalReqTokenName,
              precision: foundCachedAsset.precision,
            });
            setInProgress(false);
            return;
          }

          let assetDetails;
          try {
            assetDetails = await lookupSymbols(currentNodes[0], params.env, [finalReqTokenName]);
          } catch (error) {
            console.log(error);
            changeURL(params.env);
            setInProgress(false);
            return;
          }

          if (!assetDetails || !assetDetails.length) {
            setInProgress(false);
            return;
          }

          const assetData = assetDetails.map((q) => ({
            id: q.id,
            symbol: q.symbol,
            precision: q.precision,
            issuer: q.issuer,
            options: {
              max_supply: q.options.max_supply
            },
            dynamic_asset_data_id: q.dynamic_asset_data_id
          }));

          addOne(params.env, assetData[0]);

          setRequiredTokenDetails({
            id: assetDetails[0].id,
            symbol: finalReqTokenName,
            precision: assetDetails[0].precision,
          }); // store new

          setInProgress(false);
        }
      }, 1000);

      return () => clearTimeout(delayDebounceFn);
    }

    if (finalReqQty && finalReqQty > 0 && finalReqTokenName && finalReqTokenName.length) {
      fetchTokenDetails();
    }
  }, [finalReqQty, reqdTokenItr]);

  // Initial winners
  const sortedWinners = plannedAirdropData.calculatedAirdrop.summary.map((winner) => ({
    ...winner,
    balances: envLeaderboard.find((x) => x.id === winner.id).balances,
  })).sort((a, b) => b.qty - a.qty);

  let invalidOutput = [];
  for (let k = 0; k < sortedWinners.length; k++) {
    if (k === 0) {
      invalidOutput = [];
    }
    const user = sortedWinners[k];
    const reasons = [];
    if (tokenReq && tokenReq === "yes" && requiredTokenDetails) {
      // Filter out users who don't meet token requirement
      const balancePresent = user.balances.map((asset) => asset.asset_id).includes(requiredTokenDetails.id);
      if (!balancePresent) {
        // missing balance
        reasons.push(t("performAirdrop:grid.left.table.reasons.noBalance"));
      } else {
        const foundAsset = user.balances.find((asset) => asset.asset_id === requiredTokenDetails.id);
        const foundAmount = humanReadableFloat(foundAsset.amount, requiredTokenDetails.precision);
        if (foundAmount < finalReqQty) {
          // insufficient balance
          reasons.push(t("performAirdrop:grid.left.table.reasons.insufficientBalance"));
        }
      }
    }

    if (blocking && blocking === 'yes' && blockList.find((x) => x === user.id)) {
      // Filter out blocked users from airdrop
      reasons.push(t("performAirdrop:grid.left.table.reasons.blocked"));
    }

    if (ltmReq && ltmReq === 'yes') {
      // Filter out non LTM users from airdrop
      const { ltm } = envLeaderboard.find((x) => x.id === user.id).account;
      if (!ltm) {
        reasons.push(t("performAirdrop:grid.left.table.reasons.ltm"));
      }
    }

    if (account && user.id === account) {
      reasons.push(t("performAirdrop:grid.left.table.reasons.self"));
    }

    // If there's any reason to exclude, do so!
    if (reasons && reasons.length) {
      invalidOutput.push({ ...user, reason: reasons.join(", ") });
    }
  }

  const validOutput = _.difference(sortedWinners.map((person) => person.id), invalidOutput.map((person) => person.id))
    .map((validEntry) => sortedWinners.find((winner) => winner.id === validEntry));

  const ticketQty = validOutput
    .map((x) => x.qty)
    .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0);

  let tokenRows = [];
  let remainingTokens = finalTokenQuantity ?? 0;
  const itrQty = distroMethod === "RoundRobin" && finalTokenQuantity
    ? finalTokenQuantity
    : validOutput.length;

  for (let i = 0; i < itrQty; i++) {
    if (i === 0) {
      tokenRows = [];
      remainingTokens = finalTokenQuantity;
    }

    if (distroMethod === "Proportionally") {
      tokenRows.push({
        ...validOutput[i],
        assignedTokens: ((validOutput[i].qty / ticketQty) * finalTokenQuantity),
      });
    } else if (distroMethod === "Equally") {
      tokenRows.push({
        ...validOutput[i],
        assignedTokens: ((1 / validOutput.length) * finalTokenQuantity),
      });
    } else if (distroMethod === "RoundRobin") {
      const algoItr = i >= validOutput.length
        ? Math.round(((i / validOutput.length) % 1) * validOutput.length)
        : i;

      if (remainingTokens < 1) {
        // No more to allocate
        break;
      }

      remainingTokens -= 1;

      const currentWinner = validOutput[algoItr];
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
  let winners = [];
  if (!tokenDetails || (finalReqTokenName && finalReqQty && !requiredTokenDetails)) {
    validRows = [];
    invalidRows = [];
    winnerChunks = [];
  } else {
    const valid = tokenRows
      .sort((a, b) => b.assignedTokens - a.assignedTokens)
      .filter((user) => user.assignedTokens > humanReadableFloat(1, tokenDetails.precision) || (tokenDetails.precision === 0 && tokenDetails.readableMax === 1 && parseFloat(user.assignedTokens) === 1));

    winners = valid;

    winnerChunks = valid.length
      ? sliceIntoChunks(valid.sort((a, b) => b.qty - a.qty), finalBatchSize)
      : [];

    validRows = valid.length
      ? valid
        .map((winner) => (
          <tr key={`winner_${winner.id}`}>
            <td width="45%">
              <Link style={{ textDecoration: 'none', color: 'black' }} to={`/Account/${params.env}/${winner.id}`}>
                <b>{envLeaderboard.find((usr) => usr.id === winner.id).account.name}</b>
              </Link><br />
              (
                <Link style={{ textDecoration: 'none' }} to={`/Account/${params.env}/${winner.id}`}>
                  {winner.id}
                </Link>
              )
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

    invalidRows = invalidOutput.length
      ? invalidOutput
        .map((loser) => (
          <tr key={`loser_${loser.id}`}>
            <td>
              <Link style={{ textDecoration: 'none', color: 'black' }} to={`/Account/${params.env}/${loser.id}`}>
                <b>{envLeaderboard.find((usr) => usr.id === loser.id).account.name}</b>
              </Link><br />
              (
                <Link style={{ textDecoration: 'none' }} to={`/Account/${params.env}/${loser.id}`}>
                  {loser.id}
                </Link>
              )
            </td>
            <td>
              {
                loser.reason
                  ? loser.reason
                  : t("performAirdrop:grid.left.table.reasons.minReward")
              }
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
      <Title order={3} ta="center" mt="sm">
        {t("performAirdrop:header.title", { titleName })}
        <br />
        <Link to={`/PlannedAirdrop/${params.env}/${params.id}`}>
          <Button variant="outline" compact>
            {t("performAirdrop:header.back")}
          </Button>
        </Link>
      </Title>

      {
        !plannedAirdropData && !account
          ? <Text>{t("performAirdrop:noTicket")}</Text>
          : null
      }

      {
        !account
          ? <GetAccount />
          : null
      }

      {
        plannedAirdropData && account && account.length
          ? (
            <SimpleGrid cols={2} spacing="sm" mt={10} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
              <Card shadow="md" radius="md" padding="xl" mt={20}>
                {
                  (inProgress)
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
                  finalReqTokenName && !tokenDetails && !inProgress && finalTokenQuantity
                    ? (
                      <>
                        <Text>Sorry, something went wrong...</Text>
                        <Button onClick={() => setTokenItr(tokenItr + 1)}>Refresh</Button>
                      </>
                    )
                    : null
                }
                {
                  finalReqTokenName && !requiredTokenDetails && !inProgress && finalReqQty
                    ? (
                      <>
                        <Text>Sorry, something went wrong...</Text>
                        <Button onClick={() => setReqdTokenItr(reqdTokenItr + 1)}>Refresh</Button>
                      </>
                    )
                    : null
                }
                {
                  validRows && validRows.length
                    ? (
                      <>
                        <Accordion mt="xs" defaultValue="table">
                          <Accordion.Item key="validTable" value="table">
                            <Accordion.Control>
                              {t("performAirdrop:grid.left.table.title")}
                            </Accordion.Control>
                            <Accordion.Panel>
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
                            </Accordion.Panel>
                          </Accordion.Item>
                          <Accordion.Item key="json" value="airdrop_json">
                            <Accordion.Control>
                              {t("performAirdrop:grid.left.json")}
                            </Accordion.Control>
                            <Accordion.Panel style={{ backgroundColor: '#FAFAFA' }}>
                              <JsonInput
                                placeholder="Textarea will autosize to fit the content"
                                defaultValue={JSON.stringify(winners)}
                                validationError="Invalid JSON"
                                formatOnBlur
                                autosize
                                minRows={4}
                                maxRows={15}
                              />
                            </Accordion.Panel>
                          </Accordion.Item>
                          <Accordion.Item key="jsonSimple" value="airdrop_json_simple">
                            <Accordion.Control>
                              {t("performAirdrop:grid.left.jsonSimple")}
                            </Accordion.Control>
                            <Accordion.Panel style={{ backgroundColor: '#FAFAFA' }}>
                              <JsonInput
                                placeholder="Textarea will autosize to fit the content"
                                defaultValue={
                                  JSON.stringify(
                                    winners.map((x) => ({
                                      id: x.id,
                                      ticketQty: x.qty,
                                      percent: x.percent,
                                      assignedTokens: x.assignedTokens
                                    }))
                                  )
                                }
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
                {
                  invalidRows && invalidRows.length// && (!tokenReq && !tokenReq === 'yes' && !requiredTokenDetails)
                    ? (
                      <Accordion mt="xs">
                        <Accordion.Item key="invalidTable" value="table2">
                          <Accordion.Control>
                            {t("performAirdrop:grid.left.table.title2")}
                          </Accordion.Control>
                          <Accordion.Panel>
                            <Table highlightOnHover>
                              <thead>
                                <tr>
                                  <th>{t("performAirdrop:grid.left.table.th1")}</th>
                                  <th>{t("performAirdrop:grid.left.table.th4")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {invalidRows}
                              </tbody>
                            </Table>
                          </Accordion.Panel>
                        </Accordion.Item>
                      </Accordion>
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
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("performAirdrop:grid.right.summary.sendingAccount")}: {
                      identity && identity.account ? identity.account.name : account
                      } {identity && identity.account ? `(${identity.account.id})` : null}
                    </Text>
                  </Card>
                  <Card shadow="md" radius="md" padding="sm">
                    <Text fz="lg" fw={600} mt="md">
                      {t("performAirdrop:grid.right.options.title")}
                    </Text>
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
                      value={blocking}
                      onChange={setBlocking}
                      name="blocking"
                      label={t("performAirdrop:grid.right.options.blocking.title")}
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
                            {
                              requiredToken
                                ? (
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
                                )
                                : null
                            }
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
                              validRows.length / finalBatchSize < 1
                                ? t("performAirdrop:grid.right.valid.single", { batchSize })
                                : t("performAirdrop:grid.right.valid.multi", { batchSize, qtyBatches: Math.ceil(validRows.length / finalBatchSize) })
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
          : null
      }
    </Card>
  );
}
