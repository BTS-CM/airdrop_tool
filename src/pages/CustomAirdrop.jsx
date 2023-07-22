/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  SimpleGrid,
  Card,
  Radio,
  Button,
  Group,
  Center,
  Loader,
  TextInput,
} from '@mantine/core';
import _ from "lodash";
import { sort } from 'fast-sort';
import {
  HiOutlineShieldExclamation,
  HiOutlineShieldCheck,
} from "react-icons/hi";

import {
  appStore,
  leaderboardStore,
  beetStore,
  tempStore,
  assetStore,
  blocklistStore,
} from "../lib/states";

import AirdropCards from '../components/AirdropCards';
import AirdropLeftCard from '../components/AirdropLeftCard';

import { sliceIntoChunks } from '../lib/common';

import {
  fetchAirdropDetails,
  tokenQuantities,
  getTokenRows,
  getValidRows,
  filterMinRewards
} from "../lib/airdrop";

export default function CustomAirdrop(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

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
  let envLeaderboard = [];
  let cachedAssets = [];
  let blockList = [];

  if (params.env === 'bitshares') {
    envLeaderboard = btsLeaderboard;
    assetName = "BTS";
    titleName = "Bitshares";
    cachedAssets = btsAssets;
    blockList = btsBlockedAccounts;
  } else if (params.env === 'bitshares_testnet') {
    envLeaderboard = btsTestnetLeaderboard;
    assetName = "TEST";
    titleName = "Bitshares (Testnet)";
    cachedAssets = btsTestnetAssets;
    blockList = btsTestnetBlockedAccounts;
  } else if (params.env === 'tusc') {
    envLeaderboard = tuscLeaderboard;
    assetName = "TUSC";
    titleName = "TUSC";
    cachedAssets = tuscAssets;
    blockList = tuscBlockedAccounts;
  }

  // Beet
  const changeURL = appStore((state) => state.changeURL);
  const identity = beetStore((state) => state.identity);
  const account = tempStore((state) => state.account);
  const fileContents = tempStore((state) => state.fileContents);
  const [inProgress, setInProgress] = useState(false);

  // Radio buttons
  const [distroMethod, setDistroMethod] = useState('Proportionally');
  const [blocking, setBlocking] = useState('no');
  const [airdropTarget, setAirdropTarget] = useState('ticketQty');
  const [ticketHolder, setTicketHolder] = useState('both');

  // Debounced input
  const [tokenName, onTokenName] = useState(assetName);
  const [tokenQuantity, onTokenQuantity] = useState(100);
  const [batchSize, onBatchSize] = useState(10000);

  // Retrieved asset info
  const [tokenDetails, setTokenDetails] = useState();

  // Debounced output
  const [finalTokenName, setFinalTokenName] = useState("");
  const [finalTokenQuantity, setFinalTokenQuantity] = useState(1);
  const [finalBatchSize, setFinalBatchSize] = useState();

  // Refresh iterators
  const [tokenItr, setTokenItr] = useState(0);

  // components
  const [leftAirdropCard, setLeftAirdropCard] = useState(null);

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[params.env];
  const [fileUsers, setFileUsers] = useState();

  useEffect(() => {
    if (fileContents && fileContents.length) {
      onTokenQuantity(fileContents.length);
    }
  }, [fileContents]);

  useEffect(() => {
    if (fileContents) {
      console.time("sorting");
      setFileUsers(
        airdropTarget === "ticketQty"
          ? sort(fileContents).desc((u) => u.qty)
          : sort(fileContents).desc((u) => u.value)
      );
      console.timeEnd("sorting");
    }
  }, [fileContents, airdropTarget]);

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
    fetchAirdropDetails(
      {
        account,
        finalTokenName,
        cachedAssets,
        currentNodes,
        env: params.env
      },
      {
        addOne, changeURL, setTokenDetails, setInProgress
      }
    );
  }, [account, finalTokenName, tokenItr]);

  // Quantity of tokens to airdrop
  useEffect(() => tokenQuantities(
    {
      tokenDetails, tokenQuantity
    },
    {
      onTokenQuantity, setFinalTokenQuantity
    }
  ), [tokenQuantity, tokenDetails]);

  const [invalidOutput, setInvalidOutput] = useState();
  const validTicketHolders = useMemo(() => envLeaderboard.map((x) => x.id), [envLeaderboard]);

  useEffect(() => {
    if (
      (!account || !account.length)
      || (!fileUsers || !fileUsers.length)
    ) {
      console.log("no account or no valid ticket holders");
      return;
    }
    if (invalidOutput && invalidOutput.length) {
      setInvalidOutput([]);
    }
    if (leftAirdropCard) {
      setLeftAirdropCard(null);
    }
    const invalid = [];
    console.time("checkInvalid");
    for (let k = 0; k < fileUsers.length; k++) {
      const user = fileUsers[k];
      const reasons = [];
      if (blocking && blocking === 'yes' && blockList.find((x) => x === user.id)) {
        // Filter out blocked users from airdrop
        reasons.push("blocked");
      }

      if (account && user.id === account) {
        // Filter airdropping account from airdrop
        reasons.push("self");
      }

      if (validTicketHolders && validTicketHolders.length && ticketHolder && ticketHolder !== 'both') {
        const ticketCheck = validTicketHolders.includes(user.id);
        if (ticketHolder === 'onlyHolders' && !ticketCheck) {
          // Filter out non-ticket holders
          reasons.push("excludedNonTicketHolder");
        } else if (ticketHolder === 'noHolders' && ticketCheck) {
          // Filter out ticket holders
          reasons.push("excludedTicketHolder");
        }
      }

      if (reasons && reasons.length) {
        // If there's any reason to exclude, do so!
        invalid.push({ ...user, reason: reasons });
      }
    }
    setInvalidOutput(invalid);
    console.timeEnd("checkInvalid");
  }, [
    account,
    blocking,
    fileUsers,
    ticketHolder,
    tokenDetails,
    validTicketHolders,
  ]);

  const validOutput = useMemo(() => {
    if (!invalidOutput || !fileUsers) {
      return null;
    }
    console.time("memoizedValidDiff");
    const invalidIds = new Set();
    for (let i = 0; i < invalidOutput.length; i++) {
      invalidIds.add(invalidOutput[i].id);
    }
    const validWinners = [];
    for (let i = 0; i < fileUsers.length; i++) {
      if (!invalidIds.has(fileUsers[i].id)) {
        validWinners.push(fileUsers[i]);
      }
    }
    console.timeEnd("memoizedValidDiff");
    return validWinners;
  }, [invalidOutput, fileUsers]);

  const [ticketQty, setTicketQty] = useState(0);
  const [totalTicketValue, setTotalTicketValue] = useState(0);
  useEffect(() => {
    // Tally the valid ticket holders
    if (!validOutput || !validOutput.length) {
      return;
    }
    console.time("tallyValidOutput");
    const { totalQty, totalValue } = validOutput.reduce((accumulator, { qty, value }) => {
      accumulator.totalQty += parseInt(qty, 10);
      accumulator.totalValue += parseFloat(value);
      return accumulator;
    }, { totalQty: 0, totalValue: 0 });
    setTicketQty(totalQty);
    setTotalTicketValue(totalValue);
    console.timeEnd("tallyValidOutput");
  }, [validOutput]);

  const itrQty = useMemo(
    () => (
      distroMethod === "RoundRobin" && finalTokenQuantity
        ? finalTokenQuantity
        : validOutput?.length || 1000
    ),
    [distroMethod, finalTokenQuantity, validOutput]
  );

  const [tokenRows, setTokenRows] = useState();
  useEffect(() => {
    /*
      This assigns the chosen asset to the validOutput users
    */
    async function fetchTokenRows() {
      let rows;
      // 3-3.5s
      console.time("getTokenRows");
      try {
        rows = await getTokenRows(
          finalTokenQuantity,
          itrQty,
          distroMethod,
          validOutput,
          tokenDetails,
          airdropTarget,
          ticketQty,
          totalTicketValue
        );
      } catch (error) {
        console.log(error);
      }
      console.timeEnd("getTokenRows");
      setTokenRows(rows);
    }

    if (
      finalTokenQuantity
      && itrQty
      && distroMethod
      && validOutput
      && tokenDetails
      && airdropTarget
      && ticketQty
      && totalTicketValue
    ) {
      fetchTokenRows();
    }
  }, [
    finalTokenQuantity,
    itrQty,
    distroMethod,
    validOutput,
    tokenDetails,
    airdropTarget,
    ticketQty,
    totalTicketValue
  ]);

  const winners = useMemo(() => {
    if (!tokenRows || !tokenDetails) {
      return null;
    }
    console.time("winners");
    const totalAssignedTokens = tokenRows.reduce((total, user) => total + user.assignedTokens, 0);

    let validRows;
    try {
      validRows = getValidRows(
        {
          tokenRows, tokenDetails, totalAssignedTokens
        }
      );
    } catch (error) {
      console.log(error);
    }
    console.timeEnd("winners");

    return validRows;
  }, [tokenRows, tokenDetails]);

  const winnerChunks = useMemo(() => {
    if (!winners || !winners.length || !finalBatchSize) {
      return null;
    }
    // for airdrop distribution cards
    console.time("sliceIntoChunks");
    const slices = sliceIntoChunks(winners, finalBatchSize);
    console.timeEnd("sliceIntoChunks");
    return slices;
  }, [winners, finalBatchSize]);

  const unassignedUsers = useMemo(
    () => {
      if (!winners || !winners.length || !fileUsers) {
        return [];
      }
      console.time("unassignedUsers");
      const winnerIDs = winners.reduce((acc, current) => {
        acc[current.id] = true;
        return acc;
      }, {});
      const _result = fileUsers.filter((x) => !winnerIDs[x.id]);
      console.timeEnd("unassignedUsers");
      return _result;
    },
    [winners, fileUsers]
  );

  /*
  const { assignedTokenUsers, unassignedUsers } = useMemo(() => {
    const assignedTokenUsersSet = new Set();
    const unassignedUsersArr = [];
    if (winners && winners.length) {
      for (let i = 0; i < winners.length; i++) {
        const user = winners[i];
        if (assignedTokenUsersSet.has(user.id)) {
          continue;
        }
        if (user.assignedTokens > 0) {
          assignedTokenUsersSet.add(user.id);
        } else {
          unassignedUsersArr.push(user);
        }
      }
    }
    return {
      assignedTokenUsers: Array.from(assignedTokenUsersSet),
      unassignedUsers: unassignedUsersArr
    };
  }, [winners]);
  */

  const [finalInvalidOutput, setFinalInvalidOutput] = useState();
  useEffect(() => {
    // assign remaining reasons for invalid ticket holders
    // if (invalidOutput.length === 0 && unassignedUsers.length === 0) {
    // {msg: 'completed filterMinRewards', invalidOutput: 0, finalInvalidOutput: 0, unassignedUsers: 0, assignedTokenUsers: 0}
    // }
    async function filterMin() {
      console.time("filterMinRewards");
      try {
        await filterMinRewards(
          { invalidOutput, unassignedUsers },
          { setFinalInvalidOutput }
        );
      } catch (error) {
        console.log(error);
        return;
      }
      console.timeEnd("filterMinRewards");
    }

    if ((invalidOutput && invalidOutput.length) || (unassignedUsers && unassignedUsers.length)) {
      filterMin();
    } else {
      setFinalInvalidOutput([]);
    }
  }, [unassignedUsers, invalidOutput]);

  useEffect(() => {
    if (winners && winners.length && !inProgress) {
      console.time("setLeftAirdropCard");
      setLeftAirdropCard(
        <AirdropLeftCard
          envLeaderboard={envLeaderboard}
          winners={winners}
          invalidOutput={finalInvalidOutput}
          inProgress={inProgress}
          assetName={assetName}
          finalTokenName={finalTokenName}
          tokenDetails={tokenDetails}
          finalTokenQuantity={finalTokenQuantity}
          setTokenItr={setTokenItr}
          tokenItr={tokenItr}
          airdropTarget={airdropTarget}
          simple
        />
      );
      console.timeEnd("setLeftAirdropCard");
    } else {
      console.log("No winners or in progress");
    }
  }, [winners, finalInvalidOutput, inProgress, finalTokenName, tokenDetails, finalTokenQuantity, tokenItr, airdropTarget]);

  return (
    <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
      <Title order={3} ta="center" mt="sm" mb="sm">
        {t("customAirdrop:header.title", { titleName })}
      </Title>

      <SimpleGrid cols={2} spacing="sm" mt={10} breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
        {
          leftAirdropCard || (
            <Card shadow="md" radius="md" padding="xl">

              <Title ta="center" order={4}>
                {t("customAirdrop:grid.left.loading")}
              </Title>

              <Center>
                <Text mt="sm">
                  {t("customAirdrop:header.processing")}
                </Text>
              </Center>
              <Center>
                <Loader variant="dots" mt="md" />
              </Center>
            </Card>
          )
        }
        <Card>
          <SimpleGrid cols={1} spacing="sm">
            <Card shadow="md" radius="md" padding="xl">
              <Text fz="lg" fw={500} mt="xs">
                {t("customAirdrop:grid.right.summary.title")}
              </Text>
              <Text fz="sm" c="dimmed" mt="xs">
                {t("customAirdrop:grid.right.summary.ticketWinQty")}: {ticketQty}
              </Text>
              <Text fz="sm" c="dimmed" mt="xs">
                {t("customAirdrop:grid.right.summary.sendingAccount")}: {
                identity && identity.account ? identity.account.name : account
                } {identity && identity.account ? `(${identity.account.id})` : null}
              </Text>
            </Card>
            <Card shadow="md" radius="md" padding="sm">
              <Text fz="lg" fw={600} mt="md">
                {t("customAirdrop:grid.right.options.title")}
              </Text>
              <TextInput
                type="string"
                withAsterisk
                placeholder={tokenName || assetName}
                label={t("customAirdrop:grid.right.options.assetName")}
                style={{ maxWidth: '400px', marginTop: '10px' }}
                onChange={(event) => onTokenName(event.currentTarget.value)}
              />
              <TextInput
                type="number"
                withAsterisk
                placeholder={batchSize}
                label={t("customAirdrop:grid.right.options.batchSize")}
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
                label={t("customAirdrop:grid.right.options.tokenQuantity")}
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
                label={t("customAirdrop:grid.right.options.distroRadio.title")}
                style={{ marginTop: '10px' }}
                withAsterisk
              >
                <Group mt="xs">
                  <Radio
                    value="Equally"
                    label={t("customAirdrop:grid.right.options.distroRadio.equally")}
                  />
                  <Radio
                    value="Proportionally"
                    label={t("customAirdrop:grid.right.options.distroRadio.proportionally")}
                  />
                  <Radio
                    value="RoundRobin"
                    label={t("customAirdrop:grid.right.options.distroRadio.roundRobin")}
                  />
                </Group>
              </Radio.Group>
              <Radio.Group
                value={blocking}
                onChange={setBlocking}
                name="blocking"
                label={t("customAirdrop:grid.right.options.blocking.title")}
                style={{ marginTop: '10px' }}
                withAsterisk
              >
                <Group mt="xs">
                  <Radio
                    value="yes"
                    label={t("customAirdrop:grid.right.options.reqRadio.yes")}
                  />
                  <Radio
                    value="no"
                    label={t("customAirdrop:grid.right.options.reqRadio.no")}
                  />
                </Group>
              </Radio.Group>
              {
                envLeaderboard && envLeaderboard.length
                  ? (
                    <Radio.Group
                      value={ticketHolder}
                      onChange={setTicketHolder}
                      name="ticketHolder"
                      label={t("customAirdrop:grid.right.options.ticketHolder.title")}
                      style={{ marginTop: '10px' }}
                      withAsterisk
                    >
                      <Group mt="xs">
                        <Radio
                          value="onlyHolders"
                          label={t("customAirdrop:grid.right.options.ticketHolder.onlyHolders")}
                        />
                        <Radio
                          value="noHolders"
                          label={t("customAirdrop:grid.right.options.ticketHolder.noHolders")}
                        />
                        <Radio
                          value="both"
                          label={t("customAirdrop:grid.right.options.ticketHolder.both")}
                        />
                      </Group>
                    </Radio.Group>
                  )
                  : null
              }
              <Radio.Group
                value={airdropTarget}
                onChange={setAirdropTarget}
                name="airdropTarget"
                label={t("customAirdrop:grid.right.options.target.title")}
                style={{ marginTop: '10px' }}
                withAsterisk
              >
                <Group mt="xs">
                  <Radio
                    value="ticketQty"
                    label={t("customAirdrop:grid.right.options.target.ticketQty")}
                  />
                  <Radio
                    value="ticketValue"
                    label={t("customAirdrop:grid.right.options.target.ticketValue")}
                  />
                </Group>
              </Radio.Group>
            </Card>
            {
              !winners || !winners.length
                ? (
                  <Card shadow="md" radius="md" padding="sm" style={{ backgroundColor: '#FAFAFA' }}>
                    <Text fz="lg" fw={500} mt="md">
                      <HiOutlineShieldExclamation />
                      {' '}
                      {t("customAirdrop:grid.right.invalid.title")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("customAirdrop:grid.right.invalid.reason")}
                    </Text>
                    <Text fz="sm" c="dimmed" mt="xs">
                      {t("customAirdrop:grid.right.invalid.resolution")}
                    </Text>
                  </Card>
                )
                : (
                  <AirdropCards
                    winners={winners}
                    winnerChunks={winnerChunks}
                    finalBatchSize={finalBatchSize}
                    batchSize={batchSize}
                    finalTokenName={finalTokenName}
                    tokenDetails={tokenDetails}
                    env={params.env}
                  />
                )
            }
          </SimpleGrid>
        </Card>
      </SimpleGrid>

      <Center>
        <Link to="/CustomAirdropPrep">
          <Button variant="outline" compact mt="xl">
            {t("customAirdrop:header.back")}
          </Button>
        </Link>
      </Center>
    </Card>
  );
}
