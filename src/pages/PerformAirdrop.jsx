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

import AirdropCard from "../components/AirdropCard";
import AirdropLeftCard from '../components/AirdropLeftCard';

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
  const [airdropTarget, setAirdropTarget] = useState(plannedAirdropData.settings.airdropTarget ?? 'ticketQty');

  // Debounced input
  const [tokenName, onTokenName] = useState(plannedAirdropData.settings.tokenName ?? assetName);
  const [tokenQuantity, onTokenQuantity] = useState(plannedAirdropData.settings.tokenQuantity ?? 1);
  const [batchSize, onBatchSize] = useState(plannedAirdropData.settings.batchSize ?? 100);

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
      && airdropTarget
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
        requiredTokenQty: finalReqQty,
        airdropTarget
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
    finalReqQty,
    airdropTarget
  ]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tokenName && tokenName.length) {
        setFinalTokenName(tokenName.toUpperCase());
      }
    }, 2000);

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

  const countDecimals = (value) => {
    if ((value % 1) !== 0) { return value.toString().split(".")[1].length; }
    return 0;
  };

  // Quantity of tokens to airdrop
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tokenQuantity && tokenQuantity > 0 && tokenDetails) {
        if (tokenDetails && tokenQuantity > tokenDetails.readableMax) {
          console.log("Max supply reached");
          onTokenQuantity(parseFloat(tokenDetails.readableMax));
          return;
        }
        if (tokenDetails && tokenQuantity < humanReadableFloat(1, tokenDetails.precision)) {
          console.log("Less than min supply");
          onTokenQuantity(humanReadableFloat(1, tokenDetails.precision));
          return;
        }
        if (countDecimals(tokenQuantity) > tokenDetails.precision) {
          console.log("Too many decimals");
          onTokenQuantity(tokenQuantity.toFixed(tokenDetails.precision));
          return;
        }
        setFinalTokenQuantity(tokenQuantity); // store new
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [tokenQuantity, tokenDetails]);

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

  // Initial winners not yet sorted
  const [sortedWinners, setSortedWinners] = useState(
    plannedAirdropData.calculatedAirdrop.summary.map((winner) => ({
      ...winner,
      balances: envLeaderboard.find((x) => x.id === winner.id).balances,
    }))
  );

  useEffect(() => {
    if (airdropTarget && airdropTarget === "ticketQty") {
      setSortedWinners(
        sortedWinners
          .filter((winner) => winner.qty > 0)
          .sort((a, b) => b.qty - a.qty)
      );
    } else if (airdropTarget && airdropTarget === "ticketValue") {
      setSortedWinners(
        sortedWinners
          .filter((winner) => winner.ticketsValue > 0)
          .sort((a, b) => b.ticketsValue - a.ticketsValue)
      );
    }
  }, [airdropTarget]);

  const [invalidOutput, setInvalidOutput] = useState([]);
  useEffect(() => {
    if (invalidOutput && invalidOutput.length) {
      setInvalidOutput([]);
    }
    const invalid = [];
    for (let k = 0; k < sortedWinners.length; k++) {
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
        invalid.push({ ...user, reason: reasons });
      }
    }
    setInvalidOutput(invalid);
  }, [
    account,
    tokenReq,
    requiredTokenDetails,
    blocking,
    ltmReq
  ]);

  const [validOutput, setValidOutput] = useState([]);
  const [ticketQty, setTicketQty] = useState(0);
  const [totalTicketValue, setTotalTicketValue] = useState(0);
  useEffect(() => {
    // Remove the invalid ticket holders
    const validDiff = _.difference(
      sortedWinners.map((person) => person.id),
      invalidOutput.map((person) => person.id)
    )
      .map((validEntry) => sortedWinners.find((winner) => winner.id === validEntry));

    setValidOutput(validDiff);

    // Tally the valid ticket holders
    setTicketQty(
      validDiff
        .map((x) => x.qty)
        .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0)
    );

    setTotalTicketValue(
      validDiff
        .map((x) => x.ticketsValue)
        .reduce((accumulator, ticket) => accumulator + parseFloat(ticket), 0)
    );
  }, [invalidOutput]);

  const itrQty = distroMethod === "RoundRobin" && finalTokenQuantity
    ? finalTokenQuantity
    : validOutput.length;

  const [tokenRows, setTokenRows] = useState([]);
  useEffect(() => {
    if (finalTokenQuantity && ticketQty && itrQty && validOutput.length && tokenDetails) {
      let tempRows = [];
      let remainingTokens = finalTokenQuantity ?? 0;
      let remainingTickets = airdropTarget && airdropTarget === "ticketValue"
        ? totalTicketValue
        : ticketQty;
      let equalTally = validOutput.length ?? 0;
      // Allocate assets (tokens) to the remaining valid ticket holders
      for (let i = 0; i < itrQty; i++) {
        if (i === 0) {
          tempRows = [];
          remainingTokens = finalTokenQuantity;
          remainingTickets = airdropTarget && airdropTarget === "ticketValue"
            ? totalTicketValue
            : ticketQty;
          equalTally = validOutput.length;
        }

        if (distroMethod === "Proportionally") {
          const propValue = airdropTarget && airdropTarget === "ticketValue"
            ? validOutput[i].ticketsValue
            : validOutput[i].qty;
          const proportionalAllocation = parseFloat(
            ((propValue / remainingTickets) * remainingTokens).toFixed(tokenDetails.precision)
          );
          remainingTokens -= proportionalAllocation;
          remainingTickets -= propValue;
          tempRows.push({ ...validOutput[i], assignedTokens: proportionalAllocation });
        } else if (distroMethod === "Equally") {
          const equalAllocation = parseFloat(
            ((1 / equalTally) * remainingTokens).toFixed(tokenDetails.precision)
          );
          remainingTokens -= equalAllocation;
          equalTally -= 1;
          tempRows.push({ ...validOutput[i], assignedTokens: equalAllocation });
        } else if (distroMethod === "RoundRobin") {
          const algoItr = i >= validOutput.length
            ? Math.round(((i / validOutput.length) % 1) * validOutput.length)
            : i;

          remainingTokens -= 1;

          const currentWinner = validOutput[algoItr];
          let existingRow = tempRows.find((x) => currentWinner.id === x.id);
          if (!existingRow) {
            tempRows.push({
              ...currentWinner, assignedTokens: 1,
            });
            continue;
          }

          existingRow = { ...existingRow, assignedTokens: existingRow.assignedTokens + 1 };

          const filteredRows = tempRows.filter((x) => x.id !== currentWinner.id);
          filteredRows.push(existingRow);
          tempRows = filteredRows;
        }
      }

      setTokenRows(tempRows);
    }
  }, [
    finalTokenQuantity,
    itrQty,
    distroMethod,
    blocking,
    ltmReq,
    tokenReq,
    requiredToken,
    validOutput,
    tokenDetails
  ]);

  const [winnerChunks, setWinnerChunks] = useState([]);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    if (tokenRows && tokenRows.length) {
      if (!tokenDetails || (finalReqTokenName && finalReqQty && !requiredTokenDetails)) {
        setWinners([]);
        setWinnerChunks([]);
      } else {
        let valid = tokenRows.sort((a, b) => b.assignedTokens - a.assignedTokens);

        if (tokenDetails.precision > 0) {
          valid = valid.filter((user) => user.assignedTokens > humanReadableFloat(1, tokenDetails.precision));
        } else if (tokenDetails.precision === 0 && tokenDetails.readableMax === 1) {
          valid = valid.filter((user) => user.assignedTokens === 1);
        } else if (tokenDetails.precision === 0 && tokenDetails.readableMax > 1) {
          valid = valid.filter((user) => user.assignedTokens > 1);
        }

        // if valid.length < tokenRows.length, then redistribute the missing user assignedTokens to those above proportionally
        if (valid.length < tokenRows.length) {
          // Calculate the total assigned tokens
          const totalAssignedTokens = tokenRows.reduce((total, user) => total + user.assignedTokens, 0);
          const validAssignedTokens = valid.reduce((total, user) => total + user.assignedTokens, 0);

          const missingTokens = totalAssignedTokens - validAssignedTokens;
          if (valid && valid.length) {
            valid[0].assignedTokens += missingTokens;
          }
        }

        setWinners(valid); // for left airdrop cards
        setWinnerChunks(
          valid.length // for airdrop distribution cards
            ? sliceIntoChunks(valid.sort((a, b) => b.qty - a.qty), finalBatchSize)
            : []
        );
      }
    }
  }, [
    tokenRows,
    finalBatchSize,
    tokenDetails,
    finalReqTokenName,
    finalReqQty,
    requiredTokenDetails,
    airdropTarget
  ]);

  const [finalInvalidOutput, setFinalInvalidOutput] = useState([]);
  useEffect(() => {
    // assign remaining reasons for invalid ticket holders
    const assignedTokenUsers = winners.map((x) => x.id);
    const unassignedUsers = sortedWinners.filter((x) => !assignedTokenUsers.includes(x.id));
    const currentlyInvalidIDs = invalidOutput.map((person) => person.id);

    let newInvalidOutput = [...invalidOutput];
    for (let i = 0; i < unassignedUsers.length; i++) {
      const current = unassignedUsers[i];
      if (currentlyInvalidIDs.includes(current.id)) {
        // update the reasons
        const currentInvalid = invalidOutput.find((x) => x.id === current.id);

        const updatedInvalid = {
          ...currentInvalid,
          reason: [...currentInvalid.reason, t("performAirdrop:grid.left.table.reasons.minReward")]
        };

        const filteredInvalid = newInvalidOutput.filter((x) => x.id !== current.id);
        filteredInvalid.push(updatedInvalid);
        newInvalidOutput = filteredInvalid;
      } else {
        // provide a remaining reason
        newInvalidOutput.push({
          ...current,
          reason: [t("performAirdrop:grid.left.table.reasons.minReward")]
        });
      }
    }
    setFinalInvalidOutput(newInvalidOutput);
  }, [winners, invalidOutput]);

  // Cards which enable user to perform airdrop
  const airdropCards = winnerChunks && winnerChunks.length
    ? winnerChunks.map((chunk, i) => (
      <AirdropCard
        tokenQuantity={tokenQuantity}
        tokenName={finalTokenName}
        distroMethod={distroMethod}
        chunk={chunk}
        chunkItr={i}
        winnerChunkQty={winnerChunks.length}
        quantityWinners={winners.length}
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
        plannedAirdropData && account && account.length
          ? (
            <SimpleGrid cols={2} spacing="sm" mt={10} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
              {
                winners
                  ? (
                    <AirdropLeftCard
                      envLeaderboard={envLeaderboard}
                      winners={winners}
                      invalidOutput={finalInvalidOutput}
                      inProgress={inProgress}
                      assetName={assetName}
                      finalTokenName={finalTokenName}
                      tokenDetails={tokenDetails}
                      finalTokenQuantity={finalTokenQuantity}
                      finalReqTokenName={finalReqTokenName}
                      requiredTokenDetails={requiredTokenDetails}
                      finalReqQty={finalReqQty}
                      setTokenItr={setTokenItr}
                      tokenItr={tokenItr}
                      setReqdTokenItr={setReqdTokenItr}
                      reqdTokenItr={reqdTokenItr}
                      tokenReq={tokenReq}
                      airdropTarget={airdropTarget}
                    />
                  )
                  : null
              }

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
                      value={tokenQuantity}
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
                      value={airdropTarget}
                      onChange={setAirdropTarget}
                      name="airdropTarget"
                      label={t("performAirdrop:grid.right.options.target.title")}
                      style={{ marginTop: '10px' }}
                      withAsterisk
                    >
                      <Group mt="xs">
                        <Radio
                          value="ticketQty"
                          label={t("performAirdrop:grid.right.options.target.ticketQty")}
                        />
                        <Radio
                          value="ticketValue"
                          label={t("performAirdrop:grid.right.options.target.ticketValue")}
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
                    !winners || !winners.length
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
                              winners.length / finalBatchSize < 1
                                ? t("performAirdrop:grid.right.valid.single", { batchSize })
                                : t("performAirdrop:grid.right.valid.multi", { batchSize, qtyBatches: Math.ceil(winners.length / finalBatchSize) })
                            }
                          </Text>
                          <Text fz="sm" c="dimmed" mt="xs">
                            {t("performAirdrop:grid.right.valid.reminder")}
                          </Text>
                          {
                            airdropCards ?? null
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
