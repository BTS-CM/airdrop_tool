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

import GetAccount from "../pages/GetAccount";
import { lookupSymbols } from "../lib/directQueries";
import { sliceIntoChunks, humanReadableFloat } from '../lib/common';

export default function AirdropLeftCard(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const {
    winners,
    envLeaderboard,
    tokenDetails,
    finalReqTokenName,
    finalReqQty,
    inProgress,
    finalTokenQuantity,
    requiredTokenDetails,
    invalidOutput,
    finalTokenName,
    assetName,
    setTokenItr,
    tokenItr,
    setReqdTokenItr,
    reqdTokenItr,
    tokenReq
  } = properties;

  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [simpleWinnerJSON, setSimpleWinnerJSON] = useState(JSON.stringify([]));

  useEffect(() => {
    setSimpleWinnerJSON(JSON.stringify([]));
    if (!tokenDetails || (finalReqTokenName && finalReqQty && !requiredTokenDetails)) {
      setValidRows([]);
      setInvalidRows([]);
    } else {
      // accordian table rows for those included in airdrop
      setValidRows(
        winners.length
          ? winners
            .map((winner) => (
            <tr key={`winner_${winner.id}`}>
              <td width="35%">
                <Link style={{ textDecoration: 'none', color: 'black' }} to={`/Account/${params.env}/${winner.id}`}>
                  <b>{envLeaderboard.find((usr) => usr.id === winner.id).account.name}</b>
                </Link><br />
                (
                  <Link style={{ textDecoration: 'none' }} to={`/Account/${params.env}/${winner.id}`}>
                    {winner.id}
                  </Link>
                )
              </td>
              <td width="25%">
                {winner.qty}
              </td>
              <td width="40%">
                {
                  winner.assignedTokens.toFixed(tokenDetails.precision)
                }
                <br />
                {finalTokenName || assetName}
              </td>
            </tr>
            ))
          : []
      );

      // accordian table rows for those excluded from airdrop
      setInvalidRows(
        invalidOutput.length
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
                  loser.reason && loser.reason.length > 1
                    ? loser.reason.map((reason, i) => (
                      <><Text>{i + 1}. {reason}</Text></>
                    ))
                    : <Text>1. {loser.reason}</Text>
                }
              </td>
            </tr>
            ))
          : []
      );

      setSimpleWinnerJSON(JSON.stringify(
        winners.map((x) => ({
          user: `${envLeaderboard.find((usr) => usr.id === x.id).account.name} (${x.id})`,
          ticketQty: x.qty,
          percent: x.percent,
          assignedTokens: x.assignedTokens
        })),
        null,
        4
      ));
    }
  }, [
    winners,
    invalidOutput,
    tokenDetails,
    finalTokenQuantity,
    finalReqTokenName,
    finalReqQty,
    requiredTokenDetails
  ]);

  return (
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
              <Text>{t("performAirdrop:grid.left.reloadingTokenDetails")}</Text>
              <Button onClick={() => setTokenItr(tokenItr + 1)}>Refresh</Button>
            </>
          )
          : null
      }
      {
        finalReqTokenName && !requiredTokenDetails && !inProgress && finalReqQty
          ? (
            <>
              <Text>{t("performAirdrop:grid.left.reloadingRequiredTokenDetails")}</Text>
              <Button onClick={() => setReqdTokenItr(reqdTokenItr + 1)}>Refresh</Button>
            </>
          )
          : null
      }
      {
        !validRows
          ? (
            <>
              <Accordion mt="xs" defaultValue="table">
                <Accordion.Item key="invalidTable" value="table">
                  <Accordion.Control>
                    {t("performAirdrop:grid.left.table.title")}
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text>
                      {t("performAirdrop:grid.left.table.invalid")}
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
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
                <Accordion.Item key="jsonSimple" value="airdrop_json_simple">
                  <Accordion.Control>
                    {t("performAirdrop:grid.left.jsonSimple")}
                  </Accordion.Control>
                  <Accordion.Panel style={{ backgroundColor: '#FAFAFA' }}>
                    <JsonInput
                      placeholder="Textarea will autosize to fit the content"
                      defaultValue={simpleWinnerJSON}
                      value={simpleWinnerJSON}
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
        invalidRows && invalidRows.length
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
  );
}
