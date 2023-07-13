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

  const [plannedAirdropData, setPlannedAirdropData] = useState();

  let assetName = "";
  let titleName = "token";
  let relevantChain = "";
  let envLeaderboard = [];
  let cachedAssets = [];
  let blockList = [];

  if (params.env === 'bitshares') {
    envLeaderboard = btsLeaderboard;
    assetName = "BTS";
    relevantChain = 'BTS';
    titleName = "Bitshares";
    cachedAssets = btsAssets;
    blockList = btsBlockedAccounts;
  } else if (params.env === 'bitshares_testnet') {
    envLeaderboard = btsTestnetLeaderboard;
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
    titleName = "Bitshares (Testnet)";
    cachedAssets = btsTestnetAssets;
    blockList = btsTestnetBlockedAccounts;
  } else if (params.env === 'tusc') {
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
  const [distroMethod, setDistroMethod] = useState('Proportionally');
  const [blocking, setBlocking] = useState('no');
  const [airdropTarget, setAirdropTarget] = useState('ticketQty');

  // Debounced input
  const [tokenName, onTokenName] = useState(assetName);
  const [tokenQuantity, onTokenQuantity] = useState(100);
  const [batchSize, onBatchSize] = useState(2000);

  // Retrieved asset info
  const [tokenDetails, setTokenDetails] = useState();

  // Debounced output
  const [finalTokenName, setFinalTokenName] = useState("");
  const [finalTokenQuantity, setFinalTokenQuantity] = useState(1);
  const [finalBatchSize, setFinalBatchSize] = useState();

  // Refresh iterators
  const [tokenItr, setTokenItr] = useState(0);

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[params.env];

  const countDecimals = (value) => {
    if ((value % 1) !== 0) { return value.toString().split(".")[1].length; }
    return 0;
  };

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

  const [processing, setProcessing] = useState(false);
  const [retrievedObjects, setRetrievedObjects] = useState([]);
  // fetch the usernames for all the fileContents[x].id
  useEffect(() => {
    async function processFile() {
      setProcessing(true);
      console.log("Processing file");
      let objs;
      try {
        objs = await getObjects(currentNodes[0], params.env, fileContents.map((x) => x.id));
      } catch (error) {
        console.log(error);
        setProcessing(false);
        return;
      }
      setProcessing(false);
      setRetrievedObjects(objs);
      setSortedWinners(
        airdropTarget === "ticketQty"
          ? fileContents.sort((a, b) => b.qty - a.qty)
          : fileContents.sort((a, b) => b.value - a.value)
      );
    }

    if (fileContents && airdropTarget) {
      processFile();
    }
  }, [fileContents, airdropTarget]);

  const [invalidOutput, setInvalidOutput] = useState([]);
  useEffect(() => {
    if (invalidOutput && invalidOutput.length) {
      setInvalidOutput([]);
    }
    const invalid = [];
    for (let k = 0; k < sortedWinners.length; k++) {
      const user = sortedWinners[k];
      const reasons = [];
      if (blocking && blocking === 'yes' && blockList.find((x) => x === user.id)) {
        // Filter out blocked users from airdrop
        reasons.push(t("customAirdrop:grid.left.table.reasons.blocked"));
      }

      if (account && user.id === account) {
        // Filter airdropping account from airdrop
        reasons.push(t("customAirdrop:grid.left.table.reasons.self"));
      }

      if (retrievedObjects && !retrievedObjects.some((obj) => obj.id === user.id)) {
        // Filter out users that don't have a corresponding object in retrievedObjects
        reasons.push(t("customAirdrop:grid.left.table.reasons.noObject"));
      }

      if (reasons && reasons.length) {
        // If there's any reason to exclude, do so!
        invalid.push({ ...user, reason: reasons });
      }
    }
    setInvalidOutput(invalid);
  }, [
    account,
    blocking,
    sortedWinners
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
        .map((x) => x.value)
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
            ? validOutput[i].value
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
    validOutput,
    tokenDetails,
    airdropTarget
  ]);

  const [winnerChunks, setWinnerChunks] = useState([]);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    if (tokenRows && tokenRows.length && tokenDetails) {
      let valid = tokenRows.sort((a, b) => b.assignedTokens - a.assignedTokens);
      if (tokenDetails.precision > 0) {
        valid = valid.filter((user) => user.assignedTokens > humanReadableFloat(1, tokenDetails.precision));
      } else if (tokenDetails.precision === 0 && tokenDetails.readableMax === 1) {
        valid = valid.filter((user) => user.assignedTokens === 1);
      } else if (tokenDetails.precision === 0 && tokenDetails.readableMax > 1) {
        valid = valid.filter((user) => user.assignedTokens >= 1);
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
  }, [
    tokenRows,
    finalBatchSize,
    tokenDetails,
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
          reason: [...currentInvalid.reason, t("customAirdrop:grid.left.table.reasons.minReward")]
        };

        const filteredInvalid = newInvalidOutput.filter((x) => x.id !== current.id);
        filteredInvalid.push(updatedInvalid);
        newInvalidOutput = filteredInvalid;
      } else {
        // provide a remaining reason
        newInvalidOutput.push({
          ...current,
          reason: [t("customAirdrop:grid.left.table.reasons.minReward")]
        });
      }
    }
    setFinalInvalidOutput(newInvalidOutput);
  }, [winners, invalidOutput]);

  const leftAirdropCard = winners
    ? (
      <AirdropLeftCard
        envLeaderboard={envLeaderboard}
        winners={winners.sort((a, b) => b.assignedTokens - a.assignedTokens).slice(0, 10)}
        invalidOutput={finalInvalidOutput}
        inProgress={inProgress}
        assetName={assetName}
        finalTokenName={finalTokenName}
        tokenDetails={tokenDetails}
        finalTokenQuantity={finalTokenQuantity}
        setTokenItr={setTokenItr}
        tokenItr={tokenItr}
        airdropTarget={airdropTarget}
      />
    )
    : null;

  

  return (
    <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
      <Title order={3} ta="center" mt="sm" mb="sm">
        {t("customAirdrop:header.title", { titleName })}
      </Title>
      {
        fileContents && account && account.length
          ? (
            <Title order={4} ta="center" mb="md">
              {t("customAirdrop:header.subtitle")}
            </Title>
          )
          : null
      }

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
                leftAirdropCard
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
                            winnerChunks && winnerChunks.length && tokenDetails
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
                              : null
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
