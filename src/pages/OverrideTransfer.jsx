/* eslint-disable react/no-array-index-key */
/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  TextInput,
  Select,
  Radio,
  Table,
  Button,
  Checkbox,
  Group,
  Center,
  ScrollArea
} from '@mantine/core';

import {
  leaderboardStore, tempStore, assetStore
} from '../lib/states';
import BeetModal from '../components/BeetModal';
import GetAccount from "../components/GetAccount";

import { blockchainFloat, getFlagBooleans, humanReadableFloat } from '../lib/common';

const countDecimals = (value) => {
  if ((value % 1) !== 0) { return value.toString().split(".")[1].length; }
  return 0;
};

export default function OverrideTransfer(properties) {
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState();

  const [qtyType, setQtyType] = useState('all');
  const [chosenAsset, setChosenAsset] = useState();

  const [tokenQuantity, onTokenQuantity] = useState();
  const [correctedTokenQuantity, setCorrectedTokenQuantity] = useState();

  const account = tempStore((state) => state.account);
  const setAccount = tempStore((state) => state.setAccount);

  const btsAssets = assetStore((state) => state.bitshares);
  const btsTestnetAssets = assetStore((state) => state.bitshares_testnet);

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);

  const [selection, setSelection] = useState([]);
  const toggleRow = (id) => setSelection(
    (current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  );

  const [leaderboardJSON, setLeaderboardJSON] = useState([]);
  const [relevantAssets, setRelevantAssets] = useState([]);
  const [assetName, setAssetName] = useState("1.3.0");
  const [relevantChain, setRelevantChain] = useState("Bitshares");

  useEffect(() => {
    console.log("account");
    setAccount();
  }, []);

  useEffect(() => {
    setLeaderboardJSON(value === 'bitshares' ? btsLeaderboard : btsTestnetLeaderboard);
    setAssetName(value === 'bitshares' ? "BTS" : "TEST");
    setRelevantChain(value === 'bitshares' ? "Bitshares" : `Bitshares (${t("overrideTransfer:testnet")})`);
    if (value === 'bitshares') {
      setRelevantAssets(
        account
          ? btsAssets.filter((x) => x.issuer === account)
          : []
      );
    } else if (value === 'bitshares_testnet') {
      setRelevantAssets(
        account
          ? btsTestnetAssets.filter((x) => x.issuer === account)
          : []
      );
    }
  }, [value, account]);

  const [assetDetails, setAssetDetails] = useState();
  const [assetFlags, setAssetFlags] = useState({});
  const [usersWithAsset, setUsersWithAsset] = useState([]);
  const setAssetFlagsFromDetails = (details) => {
    if (details) {
      const flagBooleans = getFlagBooleans(
        details.options.flags,
        details.isBitasset
      );
      setAssetFlags(flagBooleans);
    }
  };

  useEffect(() => {
    if (
      chosenAsset
      && leaderboardJSON && leaderboardJSON.length
      && relevantAssets && relevantAssets.length
    ) {
      const desiredUsers = leaderboardJSON
        .filter((x) => x.balances && x.balances.length && x.balances.find((y) => y.asset_id === chosenAsset))
        .map((x) => ({
          id: x.id,
          name: x.account.name,
          userAsset: x.balances.find((y) => y.asset_id === chosenAsset)
        }));

      if (desiredUsers && desiredUsers.length) {
        setUsersWithAsset(desiredUsers);

        const thisAsset = relevantAssets.find((x) => x.id === chosenAsset);
        if (thisAsset) {
          setAssetDetails(thisAsset);
        }
      }
    }
  }, [chosenAsset, leaderboardJSON, relevantAssets]);

  useEffect(() => {
    console.log("assetDetails changed");
    setAssetFlagsFromDetails(assetDetails);
  }, [assetDetails]);

  useEffect(() => {
    if (usersWithAsset && usersWithAsset.length) {
      console.log("Setting initial selection");
      setSelection(usersWithAsset.map((x) => x.id));
    }
  }, [usersWithAsset]);

  const [finalTokenQuantity, setFinalTokenQuantity] = useState();
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (qtyType === "several" && tokenQuantity && selection && selection.length) {
        console.log("several");
        if (assetDetails && tokenQuantity * selection.length > assetDetails.options.max_supply) {
          console.log("Max supply reached");
          setFinalTokenQuantity(
            parseFloat(assetDetails.options.max_supply / selection.length)
          );
        } else if (assetDetails && tokenQuantity < humanReadableFloat(1, assetDetails.precision)) {
          console.log("Less than min supply");
          setFinalTokenQuantity(
            humanReadableFloat(1, assetDetails.precision)
          );
        } else if (assetDetails && countDecimals(tokenQuantity) > assetDetails.precision) {
          console.log("Too many decimals");
          setFinalTokenQuantity(
            parseFloat(tokenQuantity.toFixed(assetDetails.precision))
          );
        } else {
          setFinalTokenQuantity(tokenQuantity);
        }
      } else if (assetDetails && qtyType === "all") {
        console.log("all");
        onTokenQuantity(assetDetails.options.max_supply);
        setFinalTokenQuantity(parseInt(assetDetails.options.max_supply, 10));
      } else if (qtyType === "one") {
        console.log("one");
        onTokenQuantity(1);
        setFinalTokenQuantity(1);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [tokenQuantity, assetDetails, qtyType, selection]);

  const [opContents, setOpContents] = useState();
  useEffect(() => {
    if (assetDetails && usersWithAsset && account && finalTokenQuantity) {
      const newOpContents = usersWithAsset
        .filter((x) => account !== x.id)
        .filter((x) => selection.includes(x.id))
        .map((x) => {
          const plannedAmount = finalTokenQuantity && finalTokenQuantity <= x.userAsset.amount
            ? finalTokenQuantity
            : x.userAsset.amount;
          return {
            fee: {
              amount: 0,
              asset_id: "1.3.0"
            },
            issuer: account,
            from: x.id,
            to: account,
            amount: {
              amount: blockchainFloat(plannedAmount, assetDetails.precision).toFixed(0),
              asset_id: assetDetails.id
            },
            extensions: []
          };
        });

      setOpContents(newOpContents);
    }
  }, [finalTokenQuantity, usersWithAsset, assetDetails, account, selection]);

  const tableRows = usersWithAsset && usersWithAsset.length && finalTokenQuantity
    ? usersWithAsset.filter((x) => account !== x.id).map((x, i) => {
      const selected = selection.includes(x.id);
      const plannedValue = selected ? x.userAsset.amount - (finalTokenQuantity) : x.userAsset.amount;
      return (
        <tr key={`tr_${x.id}_${i}`}>
          <td>
            <Checkbox
              checked={selected}
              onChange={() => toggleRow(x.id)}
              transitionDuration={0}
            />
          </td>
          <td>{x.name} ({x.id})</td>
          <td>{x.userAsset.amount}</td>
          <td style={{ color: selected ? 'black' : 'grey' }}>
            {
              plannedValue > 0
                ? plannedValue
                : 0
            }
          </td>
        </tr>
      );
    })
    : [];

  if (!value) {
    return (
      <>
        <Title order={4} align="center" mb="md">
          {t("overrideTransfer:whichBlockchain")}
        </Title>
        <Center>
          <Group>
            <Button onClick={() => setValue('bitshares')}>
              Bitshares
            </Button>
            <Button onClick={() => setValue('bitshares_testnet')}>
              Bitshares ({t("overrideTransfer:testnet")})
            </Button>
          </Group>
        </Center>
      </>
    );
  }

  if (!account) {
    return (
      <>
        <GetAccount basic env={value} />
      </>
    );
  }

  return (
    <>
        <Title order={2} ta="center" mt="sm">
          {t("overrideTransfer:title", { relevantChain })}
        </Title>

        <Text mb="xs" mt="xs">
          {t("overrideTransfer:description")}
        </Text>

        {
          !relevantAssets || !relevantAssets.length
            ? <Text mb="xs" mt="xs">{t("overrideTransfer:noAssets")}</Text>
            : null
        }

        {
          relevantAssets && relevantAssets.length
            ? (
              <Select
                mb="sm"
                label={t("overrideTransfer:chooseAsset.label")}
                placeholder={t("overrideTransfer:chooseAsset.description")}
                value={chosenAsset}
                searchable
                nothingFound={
                  t("overrideTransfer:chooseAsset.notFound")
                }
                dropdownPosition="bottom"
                onChange={setChosenAsset}
                data={
                  relevantAssets.map((x) => ({
                    value: x.id,
                    label: `${x.symbol} (${x.id})`
                  }))
                }
              />
            )
            : null
        }

        {
          chosenAsset && !(assetFlags && assetFlags.override_authority)
            ? (
            <Text>
              {t("overrideTransfer:assetNotSupported")}
            </Text>
            )
            : null
        }

        {
          assetFlags && assetFlags.override_authority
          && chosenAsset && usersWithAsset && usersWithAsset.length
            ? (
              <Radio.Group
                mb="sm"
                value={qtyType}
                onChange={setQtyType}
                name="chosenQtyType"
                label={t("overrideTransfer:chooseQty.label")}
                description={t("overrideTransfer:chooseQty.description")}
                withAsterisk
              >
                <Group mt="xs">
                  <Radio value="one" label={t("overrideTransfer:chooseQty.one")} />
                  <Radio value="several" label={t("overrideTransfer:chooseQty.several")} />
                  <Radio value="all" label={t("overrideTransfer:chooseQty.all")} />
                </Group>
              </Radio.Group>
            )
            : null
        }

        {
          assetFlags && assetFlags.override_authority
          && qtyType === "several" && assetDetails && tokenQuantity && !Number.isNaN(tokenQuantity)
            ? (
              <TextInput
                type="number"
                mb="sm"
                label={t("overrideTransfer:qty", { symbol: assetDetails.symbol })}
                style={{ maxWidth: '420px', marginTop: '20px' }}
                placeholder={finalTokenQuantity ?? tokenQuantity}
                onChange={
                  (event) => {
                    onTokenQuantity(
                      parseFloat(event.currentTarget.value)
                    );
                  }
                }
              />
            )
            : null
        }

        {
          assetFlags && assetFlags.override_authority
          && usersWithAsset && usersWithAsset.length
            ? (
              <>
                <Text>
                  {t("overrideTransfer:table.title")}
                </Text>
                <ScrollArea h={450}>
                  <Table>
                    <thead>
                      <tr>
                        <th>
                          <Checkbox
                            checked={selection.length === usersWithAsset.length}
                            onChange={() => usersWithAsset.forEach((x) => toggleRow(x.id))}
                            transitionDuration={0}
                          />
                        </th>
                        <th>
                          {t("overrideTransfer:table.th1")}
                        </th>
                        <th>
                          {t("overrideTransfer:table.th2")}
                        </th>
                        <th>
                          {t("overrideTransfer:table.th3")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows}
                    </tbody>
                  </Table>
                </ScrollArea>
              </>
            )
            : null
        }

        {
          assetFlags && assetFlags.override_authority
          && opContents && opContents.length
            ? (
              <BeetModal
                value={value}
                opContents={opContents}
                opType="override_transfer"
                opNum={38}
                opName="Override Transfer"
                appName="OverrideTransfer"
                requestedMethods={["BEET", "LOCAL", "JSON"]}
                filename="override_transfer.json"
              />
            )
            : null
        }

        {
          assetFlags && assetFlags.override_authority
          && chosenAsset && (!opContents || !opContents.length)
            ? (
              <Text mt="xs">
                {
                  t("overrideTransfer:table.noUsers")
                }
              </Text>
            )
            : null
        }
    </>
  );
}
