/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { FixedSizeList as List } from 'react-window';
import { useDisclosure } from '@mantine/hooks';

import {
  Text,
  Stack,
  Card,
  Table,
  Button,
  CopyButton,
  Pagination,
  Modal,
  Group,
  Accordion,
  JsonInput,
  Loader,
} from '@mantine/core';

export default function AirdropLeftCard(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const {
    winners,
    envLeaderboard,
    tokenDetails,
    finalReqTokenName,
    requiredToken,
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
    tokenReq,
    airdropTarget,
    simple
  } = properties;

  const [simpleWinnerJSON, setSimpleWinnerJSON] = useState(JSON.stringify([]));

  // for accodion detail windows
  const [opened1, { open: open1, close: close1 }] = useDisclosure(false);
  const [opened2, { open: open2, close: close2 }] = useDisclosure(false);
  const [opened3, { open: open3, close: close3 }] = useDisclosure(false);

  useEffect(() => {
    console.time("json");
    const tempJSON = [];
    for (let i = 0; i < winners.length; i++) {
      const x = winners[i];
      const user = !simple
        ? `${envLeaderboard.find((usr) => usr.id === x.id).account.name} (${x.id})`
        : x.id;
      const ticketQty = x.qty;
      const ticketsValue = x.ticketsValue || x.value;
      const { percent } = x;
      const { assignedTokens } = x;
      tempJSON.push({
        user,
        ticketQty,
        ticketsValue,
        percent,
        assignedTokens
      });
    }
    setSimpleWinnerJSON(JSON.stringify(tempJSON, null, 4));
    console.timeEnd("json");
  }, [winners]);

  const validPages = useMemo(() => {
    if (!winners || !winners.length) {
      return 0;
    }
    return winners.length <= 500000 ? 1 : Math.ceil(winners.length / 500000);
  }, [winners]);

  const invalidPages = useMemo(() => {
    if (!invalidOutput || !invalidOutput.length) {
      return 0;
    }
    return invalidOutput.length <= 500000 ? 1 : Math.ceil(invalidOutput.length / 500000);
  }, [invalidOutput]);

  const [activePage1, setPage1] = useState(1);
  const [activePage2, setPage2] = useState(1);

  const validNewRows = ({ index, style }) => {
    const newIndex = activePage1 > 1 ? ((activePage1 - 1) * 500000) + index : index;
    if (!winners[newIndex]) {
      return null;
    }

    const currentWinner = winners[newIndex];
    const currentID = currentWinner.id;
    return (
      <div style={{ ...style, width: "100%" }}>
        <Group position="center" key={`winner_${newIndex}`} style={{ width: "100%" }}>
          <div style={{ width: '10%' }}>
            {newIndex + 1}
          </div>
          <div style={{ width: '30%' }}>
            {
              !simple
                ? (
                  <>
                    <Link style={{ textDecoration: 'none', color: 'black' }} to={`/Account/${params.env}/${currentID}`}>
                      {
                        envLeaderboard.find((usr) => usr.id === currentID)
                          ? <b>{envLeaderboard.find((usr) => usr.id === currentID).account.name}</b>
                          : currentID
                      }
                      <b>{envLeaderboard.find((usr) => usr.id === currentID).account.name}</b> ({currentID})
                    </Link>
                  </>
                )
                : (
                  <Link style={{ textDecoration: 'none' }} to={`/Account/${params.env}/${currentID}`}>
                    {currentID}
                  </Link>
                )
            }
          </div>
          <div style={{ width: '5%' }}>
            {
              airdropTarget === "ticketQty"
                ? currentWinner.qty
                : currentWinner.ticketsValue || currentWinner.value
            }
          </div>
          <div style={{ width: '40%', textAlign: 'center' }}>
            {
              currentWinner.assignedTokens.toFixed(tokenDetails.precision)
            } {finalTokenName || assetName}
          </div>
        </Group>
      </div>
    );
  };

  const invalidNewRows = ({ index, style }) => {
    const newIndex = activePage2 > 1 ? ((activePage2 - 1) * 500000) + index : index;
    if (!invalidOutput[newIndex]) {
      return null;
    }

    const currentLoser = invalidOutput[newIndex];
    const currentID = currentLoser.id;
    return (
      <div style={{ ...style, width: "100%" }}>
        <Group position="center" key={`loser_${newIndex}`} style={{ width: "100%" }}>
          <div style={{ width: '5%' }}>
            {newIndex + 1}
          </div>
          <div style={{ width: '30%' }}>
            {
              !simple
                ? (
                  <>
                    <Link style={{ textDecoration: 'none', color: 'black' }} to={`/Account/${params.env}/${currentID}`}>
                      <b>{envLeaderboard.find((usr) => usr.id === currentID).account.name}</b> ({currentID})
                    </Link>
                  </>
                )
                : (
                  <Link style={{ textDecoration: 'none' }} to={`/Account/${params.env}/${currentID}`}>
                    {currentID}
                  </Link>
                )
            }
          </div>
          <div style={{ width: '50%' }}>
            {
              currentLoser.reason.map((x) => t(`customAirdrop:grid.left.table.reasons.${x}`)).join(", ")
            }
          </div>
        </Group>
      </div>
    );
  };

  return (
    <>
    <Card shadow="md" radius="md" padding="xl" mt={20}>
      {
        inProgress
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
        requiredToken === "Yes" && finalReqTokenName && !requiredTokenDetails && !inProgress && finalReqQty
          ? (
            <>
              <Text>{t("performAirdrop:grid.left.reloadingRequiredTokenDetails")}</Text>
              <Button onClick={() => setReqdTokenItr(reqdTokenItr + 1)}>Refresh</Button>
            </>
          )
          : null
      }
      {
        !winners && !inProgress
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
        winners && winners.length && !inProgress
          ? (
            <>
              <Accordion mt="xs" defaultValue="table">
                <Accordion.Item key="validTable" value="table">
                  <Accordion.Control>
                    {t("performAirdrop:grid.left.table.title")}
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text><b>{t("performAirdrop:grid.left.modals.included")}</b>: {winners.length}</Text>
                    <Text><b>{t("performAirdrop:grid.left.modals.preview")}</b>:</Text>
                    <Stack spacing="xs" justify="flex-start">
                      {
                        winners.slice(0, 3).map((winner, i) => (
                          <Text key={`winner_${winner.id}`}>
                            {i + 1}. <b>{envLeaderboard.find((usr) => usr.id === winner.id)?.account?.name || winner.id}</b>: {winner.assignedTokens} {finalTokenName || assetName}
                          </Text>
                        ))
                      }
                    </Stack>
                    {
                      opened1
                        ? (
                          <Button disabled style={{ marginTop: '20px' }}>
                            {t("performAirdrop:grid.left.modals.opening")}
                          </Button>
                        )
                        : (
                          <Button style={{ marginTop: '20px' }} onClick={open1}>
                            {t("performAirdrop:grid.left.modals.btn1")}
                          </Button>
                        )
                    }
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key="jsonSimple" value="airdrop_json_simple">
                  <Accordion.Control>
                    {t("performAirdrop:grid.left.jsonSimple")}
                  </Accordion.Control>
                  <Accordion.Panel style={{ backgroundColor: '#FAFAFA' }}>
                    <Text><b>{t("performAirdrop:grid.left.modals.included")}</b>: {winners.length}</Text>
                    {
                      opened2
                        ? (
                          <Button disabled style={{ marginTop: '20px' }}>
                            {t("performAirdrop:grid.left.modals.opening")}
                          </Button>
                        )
                        : (
                          <Button style={{ marginTop: '20px' }} onClick={open2}>
                            {t("performAirdrop:grid.left.modals.btn2")}
                          </Button>
                        )
                    }
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </>
          )
          : null
      }
      {
        invalidOutput && invalidOutput.length && !inProgress
          ? (
            <Accordion mt="xs">
              <Accordion.Item key="invalidTable" value="table2">
                <Accordion.Control>
                  {t("performAirdrop:grid.left.table.title2")}
                </Accordion.Control>
                <Accordion.Panel>
                  <Text><b>{t("performAirdrop:grid.left.modals.excluded")}</b>: {invalidOutput.length}</Text>
                  {
                    opened3
                      ? (
                        <Button disabled style={{ marginTop: '20px' }}>
                          {t("performAirdrop:grid.left.modals.opening")}
                        </Button>
                      )
                      : (
                        <Button style={{ marginTop: '20px' }} onClick={open3}>
                          {t("performAirdrop:grid.left.modals.btn3")}
                        </Button>
                      )
                  }
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )
          : null
      }
    </Card>
    <Modal
      opened={opened1}
      onClose={() => {
        close1();
      }}
      size="xl"
      title={t("performAirdrop:grid.left.table.title")}
    >
      {
        winners && winners.length && !inProgress
          ? (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("performAirdrop:grid.left.table.th1")}</th>
                    <th>
                      {
                        airdropTarget === "ticketQty"
                          ? t("performAirdrop:grid.left.table.th2")
                          : t("performAirdrop:grid.left.table.th22")
                      }
                    </th>
                    <th>{t("performAirdrop:grid.left.table.th3")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="4" style={{ width: "100%" }}>
                      <List
                        height={300}
                        itemCount={
                          winners && winners.length < 500000
                            ? winners.length
                            : 500000
                        }
                        itemSize={35}
                        width="100%"
                      >
                        {validNewRows}
                      </List>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <br />
              <Pagination
                value={activePage1}
                onChange={setPage1}
                total={validPages}
              />
            </>
          )
          : null
      }
    </Modal>
    <Modal
      opened={opened2}
      onClose={() => {
        close2();
      }}
      size={
        simple
          ? "sm"
          : "xl"
      }
      title={t("performAirdrop:grid.left.jsonSimple")}
    >
      {
        simpleWinnerJSON
          ? (
            <>
              {
                !simple
                  ? (
                    <>
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
                      <br />
                    </>
                  )
                  : null
              }
              <CopyButton value={simpleWinnerJSON}>
                {({ copied, copy }) => (
                  <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
                    {
                      copied
                        ? t("performAirdrop:grid.left.copied")
                        : t("performAirdrop:grid.left.copy")
                    }
                  </Button>
                )}
              </CopyButton>
            </>
          )
          : null
      }
    </Modal>
    <Modal
      opened={opened3}
      onClose={() => {
        close3();
      }}
      size="xl"
      title={t("performAirdrop:grid.left.table.title2")}
    >
      <Table highlightOnHover>
        <thead>
          <tr>
            <th width="10%">#</th>
            <th width="20%">{t("performAirdrop:grid.left.table.th1")}</th>
            <th width="70%">{t("performAirdrop:grid.left.table.th4")}</th>
          </tr>
        </thead>
        <tbody>
            <tr>
              <td colSpan="3" style={{ width: "100%" }}>
                <List
                  height={300}
                  itemCount={
                    invalidOutput && invalidOutput.length < 500000
                      ? invalidOutput.length
                      : 500000
                  }
                  itemSize={35}
                  width="100%"
                >
                  {invalidNewRows}
                </List>
                <Pagination
                  value={activePage2}
                  onChange={setPage2}
                  total={invalidPages}
                />
              </td>
            </tr>
        </tbody>
      </Table>
    </Modal>
    </>
  );
}
