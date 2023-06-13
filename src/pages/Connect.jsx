import React, { useState } from 'react';
import {
  Button,
  Box,
  ScrollArea,
  Text,
  Table,
  Loader,
  Col,
  Paper,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { appStore, beetStore, identitiesStore, tempStore } from '../lib/states';

export default function Connect(properties) {
  const { relevantChain } = properties;
  const { t, i18n } = useTranslation();
  
  const connect = beetStore((state) => state.connect);
  const setIdentity = beetStore((state) => state.setIdentity);
  const setIsLinked = beetStore((state) => state.setIsLinked);

  const setAccount = tempStore((state) => state.setAccount);

  const environment = appStore((state) => state.environment);
  const setEnvironment = appStore((state) => state.setEnvironment);

  const identities = identitiesStore((state) => state.identities);
  const setIdentities = identitiesStore((state) => state.setIdentities);
  const removeIdentity = identitiesStore((state) => state.removeIdentity);
  const removeConnection = identitiesStore((state) => state.removeConnection);

  const [inProgress, setInProgress] = useState(false);

  /**
   * Removing a previously linked identity from the identity store
   * @param {Object} rowIdentity
   */
  function remove(rowIdentity) {
    try {
      removeIdentity(rowIdentity.requested.account.id);
    } catch (error) {
      console.log(error);
    }

    try {
      removeConnection(rowIdentity.identityhash);
    } catch (error) {
      console.log(error);
    }
  }

  function beetDownload() {
    window.electron.openURL('github');
  }

  /**
   * Reconnect to Beet with chosen identity
   * @param {Object} identity
   */
  async function reconnect(identity) {
    setInProgress(true);

    setTimeout(() => {
      setInProgress(false);
      return;
    }, 5000);

    try {
      await connect(identity);
    } catch (error) {
      console.error(error);
      setInProgress(false);
      return;
    }

    setAccount(identity.account.id);
    setIsLinked(true);
    setIdentity(identity);
    setIdentities(identity);
    setInProgress(false);
  }

  /**
   * Connect to link
   */
  async function connectToBeet() {
    setInProgress(true);

    setTimeout(() => {
      setInProgress(false);
      return;
    }, 3000);

    try {
      await connect();
    } catch (error) {
      console.log(error);
      return;
    }

    console.log('connected');
    setInProgress(false);
  }

  const relevantIdentities = identities.filter((x) => x.chain === relevantChain);

  const rows = relevantIdentities
    .map((row) => (
      <tr key={`${row.requested.account.name}_row`}>
        <td>
          <Button
            variant="light"
            sx={{ marginTop: '5px', marginRight: '5px' }}
            onClick={() => {
              reconnect(row);
            }}
          >
            {row.requested.account.name}
            {' '}
            (
            {row.requested.account.id}
            )
          </Button>
          <Button
            sx={{ marginTop: '5px' }}
            variant="subtle"
            color="red"
            compact
            onClick={() => {
              remove(row);
            }}
          >
            {t('beet:connect.remove')}
          </Button>
        </td>
      </tr>
    ))
    .filter((x) => x);

  let response;
  if (inProgress === false && rows.length) {
    response = (
      <Col span={12} key="connect">
        <Paper padding="sm" shadow="xs">
          <Box mx="auto" sx={{padding: '10px', paddingTop: '10px'}}>
            <Text size="md">
              {t('beet:connect.previousBEET')}
            </Text>
            <ScrollArea
              sx={{ height: rows.length > 1 && rows.length < 3 ? rows.length * 55 : 120 }}
            >
              <Table sx={{ minWidth: 700 }}>
                <tbody>
                  {rows}
                </tbody>
              </Table>
            </ScrollArea>
          </Box>
        </Paper>
        <br />
        <Paper padding="sm" shadow="xs">
          <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
            <Text size="md">
              {t('beet:connect.newBEET')}
            </Text>
            <Button
              variant="light"
              sx={{ marginTop: '15px', marginRight: '5px', marginBottom: '5px' }}
              onClick={() => {
                connectToBeet();
              }}
            >
              {t('beet:connect.newBtn')}
            </Button>
          </Box>
        </Paper>
      </Col>
    );
  } else if (inProgress === false && !relevantIdentities.length) {
    response = [];
    response.push(
      <Col span={12} key="connect">
        <Paper padding="sm" shadow="xs">
          <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
            <Text size="md">
              {t('beet:connect.beetHeader')}
            </Text>
            <Text size="md">
              {t('beet:connect.beetSubheading')}
            </Text>
            <Button
              sx={{ marginTop: '15px', marginRight: '5px' }}
              onClick={() => {
                connectToBeet();
              }}
            >
              {t('beet:connect.beetConnect')}
            </Button>
          </Box>
        </Paper>
      </Col>
    );

    if (!identities || !identities.length) {
      response.push(
        <Col span={12} key="download">
          <Paper padding="sm" shadow="xs">
            <Box mx="auto" sx={{ padding: '10px', paddingTop: '10px' }}>
              <Text size="md">
                {t('beet:connect.btsPrompt')}
              </Text>
              <Text size="md">
                {t('beet:connect.btsGuide')}
              </Text>
              <Button
                sx={{ marginTop: '15px', marginRight: '5px' }}
                onClick={() => {
                  beetDownload();
                }}
              >
                {t('beet:connect.beetDownload')}
              </Button>
            </Box>
          </Paper>
        </Col>
      );
    }
  } else {
    response = (
      <Box mx="auto" sx={{ padding: '10px' }}>
        <span>
          <Loader variant="dots" />
          <Text size="md">
            {t('beet:connect.connecting')}
          </Text>
        </span>
      </Box>
    );
  }

  return response;
}