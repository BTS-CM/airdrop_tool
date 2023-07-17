/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState, useMemo } from 'react';
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
  FileButton,
  Center,
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

import { lookupSymbols, getObjects } from "../lib/directQueries";
import { sliceIntoChunks, humanReadableFloat } from '../lib/common';

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

  const [file, setFile] = useState();
  const [fileContents, setFileContents] = useState();
  const [sortedWinners, setSortedWinners] = useState([]);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        const contents = JSON.parse(reader.result);
        if (contents && contents.length && contents[0].id) {
          setFileContents(contents);
        }
      };
      reader.onerror = () => {
        console.error(reader.error);
      };
    }
  }, [file]);

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

  const [processing, setProcessing] = useState(false);
  const [retrievedObjects, setRetrievedObjects] = useState([]);
  // fetch the usernames for all the fileContents[x].id
  useEffect(() => {
    async function processFile() {
      setProcessing(true);
      console.log("Processing file");

      let objs = fileContents.filter((x) => x.name).length
        ? fileContents.filter((x) => x.name).map((x) => ({ name: x.name, id: x.id }))
        : [];

      const missingNames = fileContents.filter((x) => !x.name);
      if (missingNames && missingNames.length) {
        let missingObjs;
        try {
          missingObjs = await getObjects(currentNodes[0], params.env, missingNames.map((x) => x.id));
        } catch (error) {
          console.log(error);
          setProcessing(false);
          return;
        }
        objs = objs.concat(missingObjs.map((x) => ({ name: x.name, id: x.id, allowed_assets: x.allowed_assets })));
      }

      setProcessing(false);
      setRetrievedObjects(objs);
    }

    if (fileContents) {
      processFile();
    }
  }, [fileContents]);

  useEffect(() => {
    if (fileContents) {
      setSortedWinners(
        airdropTarget === "ticketQty"
          ? fileContents.sort((a, b) => b.qty - a.qty)
          : fileContents.sort((a, b) => b.value - a.value)
      );
    }
  }, [fileContents, airdropTarget]);

  const [invalidOutput, setInvalidOutput] = useState([]);
  const validTicketHolders = useMemo(() => envLeaderboard.map((x) => x.id), [envLeaderboard]);
  const retrievedObjectsIds = useMemo(() => retrievedObjects.map((x) => x.id), [retrievedObjects]);

  useEffect(() => {
    if (
      (!account || !account.length)
      || (!validTicketHolders || !validTicketHolders.length)
      || (!retrievedObjectsIds || !retrievedObjectsIds.length)
    ) {
      return;
    }
    if (invalidOutput && invalidOutput.length) {
      setInvalidOutput([]);
    }
    setInProgress(true);
    if (leftAirdropCard) {
      setLeftAirdropCard(null);
    }
    const invalid = [];
    for (let k = 0; k < sortedWinners.length; k++) {
      const user = sortedWinners[k];
      const reasons = [];
      if (blocking && blocking === 'yes' && blockList.find((x) => x === user.id)) {
        // Filter out blocked users from airdrop
        reasons.push("blocked");
      }

      if (account && user.id === account) {
        // Filter airdropping account from airdrop
        reasons.push("self");
      }

      if (ticketHolder && ticketHolder !== 'both') {
        const ticketCheck = validTicketHolders.includes(user.id);
        if (ticketHolder === 'onlyHolders' && !ticketCheck) {
          // Filter out non-ticket holders
          reasons.push("excludedNonTicketHolder");
        } else if (ticketHolder === 'noHolders' && ticketCheck) {
          // Filter out ticket holders
          reasons.push("excludedTicketHolder");
        }
      }

      if (retrievedObjects) {
        const check = retrievedObjectsIds.some((id) => id === user.id);
        if (!check) {
          // Filter out users that don't have a corresponding object in retrievedObjects
          reasons.push("noObject");
        } else {
          // Check if the account is blocking incoming assets!
          // Old disabled account feature
          const foundIndex = retrievedObjectsIds.indexOf(user.id);
          if (foundIndex !== -1 && retrievedObjects[foundIndex].allowed_assets && retrievedObjects[foundIndex].allowed_assets.length) {
            const foundObject = retrievedObjects[foundIndex];
            const foundToken = foundObject.allowed_assets.find(
              (asset) => asset.asset_id === tokenDetails.id
            );
            if (!foundToken) {
              reasons.push("blockedAssets");
            }
          }
        }
      }

      if (reasons && reasons.length) {
        // If there's any reason to exclude, do so!
        invalid.push({ ...user, reason: reasons });
      }
    }
    setInProgress(false);
    setInvalidOutput(invalid);
  }, [
    account,
    blocking,
    sortedWinners,
    ticketHolder,
    tokenDetails,
    retrievedObjects,
    validTicketHolders,
    retrievedObjectsIds
  ]);

  const [validOutput, setValidOutput] = useState([]);
  const [ticketQty, setTicketQty] = useState(0);
  const [totalTicketValue, setTotalTicketValue] = useState(0);

  const memoizedSortedWinnerIds = useMemo(() => sortedWinners.map(({ id }) => id), [sortedWinners]);
  const memoizedValidDiff = useMemo(() => {
    const validIds = _.difference(
      memoizedSortedWinnerIds,
      invalidOutput.map(({ id }) => id)
    );
    return sortedWinners.filter(({ id }) => validIds.includes(id));
  }, [memoizedSortedWinnerIds, invalidOutput, sortedWinners]);

  useEffect(() => {
    // Remove the invalid ticket holders
    setValidOutput(memoizedValidDiff);

    // Tally the valid ticket holders
    setTicketQty(
      memoizedValidDiff
        .map((x) => x.qty)
        .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0)
    );

    setTotalTicketValue(
      memoizedValidDiff
        .map((x) => x.value)
        .reduce((accumulator, ticket) => accumulator + parseFloat(ticket), 0)
    );
  }, [memoizedValidDiff]);

  const itrQty = useMemo(
    () => (
      distroMethod === "RoundRobin" && finalTokenQuantity
        ? finalTokenQuantity
        : validOutput.length
    ),
    [distroMethod, finalTokenQuantity, validOutput.length]
  );

  const [tokenRows, setTokenRows] = useState([]);

  useEffect(() => {
    async function fetchTokenRows() {
      let rows;
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

      setTokenRows(rows);
    }

    fetchTokenRows();
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

  const totalAssignedTokens = useMemo(
    () => {
      if (!tokenRows || !Array.isArray(tokenRows) || !tokenRows.length) {
        return 0;
      }
      return tokenRows.reduce((total, user) => total + user.assignedTokens, 0);
    },
    [tokenRows]
  );

  const memoizedValidTokenRows = useMemo(() => getValidRows(
    {
      tokenRows, tokenDetails, totalAssignedTokens, leftAirdropCard
    },
    {
      setLeftAirdropCard
    }
  ), [tokenRows, tokenDetails]);

  const [winnerChunks, setWinnerChunks] = useState([]);
  const [winners, setWinners] = useState([]);
  useEffect(() => {
    if (!account) {
      return;
    }
    // for left airdrop cards
    setWinners(memoizedValidTokenRows || []);

    // for airdrop distribution cards
    setWinnerChunks(
      memoizedValidTokenRows && memoizedValidTokenRows.length
        ? sliceIntoChunks(memoizedValidTokenRows, finalBatchSize)
        : []
    );
  }, [
    account,
    memoizedValidTokenRows,
    finalBatchSize
  ]);

  const assignedTokenUsers = useMemo(
    () => (winners && winners.map((x) => x.id)) || [],
    [winners]
  );

  const unassignedUsers = useMemo(
    () => (sortedWinners.filter((x) => !assignedTokenUsers.includes(x.id))),
    [sortedWinners, assignedTokenUsers]
  );

  const [finalInvalidOutput, setFinalInvalidOutput] = useState([]);
  useEffect(() => {
    // assign remaining reasons for invalid ticket holders
    if (!fileContents) {
      return;
    }
    filterMinRewards(
      { invalidOutput, unassignedUsers, leftAirdropCard },
      { setFinalInvalidOutput, setLeftAirdropCard }
    );
  }, [fileContents, unassignedUsers, invalidOutput]);

  useEffect(() => {
    if (winners && winners.length && !inProgress) {
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
          simple={true}
        />
      );
    }
  }, [winners, finalInvalidOutput, inProgress, finalTokenName, tokenDetails, finalTokenQuantity, tokenItr, airdropTarget]);

  const [validAirdropCards, setValidAirdropCards] = useState(null);
  useEffect(() => {
    if (winnerChunks && winnerChunks.length && tokenDetails) {
      setValidAirdropCards(
        winnerChunks.map((chunk, i) => (
          <AirdropCard
            tokenName={finalTokenName}
            chunk={chunk}
            chunkItr={i}
            winnerChunkQty={winnerChunks.length}
            env={params.env}
            tokenDetails={tokenDetails}
          />
        ))
      );
    } else {
      setValidAirdropCards(null);
    }
  }, [winnerChunks, tokenDetails, finalTokenName, tokenQuantity, distroMethod, winners, ticketQty, params.env]);

  return (
    <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
      <Title order={3} ta="center" mt="sm" mb="sm">
        {t("customAirdrop:header.title", { titleName })}
      </Title>
      {
        !fileContents
          ? (
            <>
              <Text align="center">
                {t("customAirdrop:uploadText")}
              </Text>
              <Text align="center">
                {t("customAirdrop:uploadText2")}
              </Text>
              <Text align="center">
                {'[{"id": "1.2.x", "qty": 1, "value": 2}]'}
              </Text>
              <Center mt="sm">
                <FileButton onChange={setFile} accept="file/JSON">
                  {(props) => <Button {...props}>{t("customAirdrop:uploadBtn")}</Button>}
                </FileButton>
              </Center>
            </>
          )
          : null
      }

      {
        processing
          ? (
            <Card>
              <Center>
                <Loader variant="dots" />
              </Center>
              <Text ta="center" mt="md">
                {t("customAirdrop:header.processing")}
              </Text>
            </Card>
          )
          : null
      }

      {
        fileContents && account && account.length && !processing
          ? (
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
                        <Card shadow="md" radius="md" padding="sm" style={{ backgroundColor: '#FAFAFA' }}>
                          <Text fz="lg" fw={500} mt="md">
                            <HiOutlineShieldCheck />
                            {' '}
                            {t("customAirdrop:grid.right.valid.title")}
                          </Text>
                          <Text fz="sm" c="dimmed" mt="xs">
                            {
                              winners.length / finalBatchSize < 1
                                ? t("customAirdrop:grid.right.valid.single", { batchSize })
                                : t("customAirdrop:grid.right.valid.multi", { batchSize, qtyBatches: Math.ceil(winners.length / finalBatchSize) })
                            }
                          </Text>
                          <Text fz="sm" c="dimmed" mt="xs">
                            {t("customAirdrop:grid.right.valid.reminder")}
                          </Text>
                          {
                            validAirdropCards
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
