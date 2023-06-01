import React, { useState } from 'react';
import { Link } from "wouter";

import {
  Title,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
} from '@mantine/core';

import {
  HiOutlineTicket,
  HiOutlineDatabase,
  HiViewList,
  HiOutlineCalculator,
  HiOutlineSave,
  HiOutlinePaperAirplane,
  HiPlus,
  HiOutlineLogin,
  HiOutlineWifi,
  HiOutlineChartPie,
  HiSearch,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi";

/*
            <Link href="/faq">
                <Card shadow="md" radius="md" padding="xl">
                    <ThemeIcon variant="light" size={40} radius={40}>
                        <HiSearch />
                    </ThemeIcon>
                    <Text fz="lg" fw={500} mt="sm">
                        Account search
                    </Text>
                    <Text fz="sm" c="dimmed" mt="sm">
                        Search for blockchain accounts
                    </Text>
                </Card>
            </Link>
*/

export default function Home(properties) {
  return (
    <>
      <Title order={2} ta="center" mt="sm">
        Welcome to the Bitshares Beet Airdrop tool!
      </Title>

      <Text c="dimmed" ta="center" mt="md">
        The following features are available for the Bitshares blockchains!
      </Text>

      <SimpleGrid cols={3} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'sm', cols: 1 }]}>
        <Link href="/fetch">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineTicket />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Ticket retrieval
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Fetch blockchain voting tickets
            </Text>
          </Card>
        </Link>
        <Link href="/analyze">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineDatabase />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Ticket data analysis
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Analyze the contents of voting tickets
            </Text>
          </Card>
        </Link>
        <Link href="/leaderboard">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiViewList />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Ticket leaderboards
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Sorts voting tickets into leaderboards
            </Text>
          </Card>
        </Link>
        <Link href="/calculate">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineCalculator />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Airdrop calculation
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Create airdrop vectors with provably random blockchain based inputs
            </Text>
          </Card>
        </Link>
        <Link href="/CalculatedAirdrops">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineChartPie />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Calculated airdrop analysis
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Verify the contents of calculated airdrops prior to execution on the blockchain
            </Text>
          </Card>
        </Link>
        <Link href="/CalculatedAirdrops">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlinePaperAirplane />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Airdrop execution
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Perform token airdrops on the blockchain
            </Text>
          </Card>
        </Link>
        <Link href="/create">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiPlus />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Ticket creation
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Lock tokens to vote and get airdrops
            </Text>
          </Card>
        </Link>
        <Link href="/faq">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineQuestionMarkCircle />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Frequently asked questions
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Learn more about airdrops, tickets and blockchains
            </Text>
          </Card>
        </Link>
        <Link href="/nodes">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineWifi />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              Configurable nodes
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              Switch between blockchain nodes
            </Text>
          </Card>
        </Link>
      </SimpleGrid>

      <Text c="dimmed" ta="center" mt="md">
        To make full use of the feature set available in this tool, the Bitshares BEET multiwallet is required.
      </Text>
    </>
  );
}
