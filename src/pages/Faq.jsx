import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Container, Title, Accordion } from '@mantine/core';

export default function FAQ(properties) {
  const { t, i18n } = useTranslation();
  const contents = [
    {
      key: 'how_airdrop',
      control: 'How do I perform an airdrop?',
      panel: 'Fetch the blockchain tickets, calculate an airdrop against a block number, verify the contents of the airdrop in the analysis page, then begin airdropping via the airdrop execution page. This will submit batches of token transfers through the BEET multiwallet; if there are thousands of receipients it will likely take 10 or more batches.',
    },
    {
      key: 'why_beet',
      control: 'Why does this tool use BEET multiwallet?',
      panel: 'The Bitshares BEET multiwallet is a multi-blockchain wallet, supporting Bitshares, Bitshares testnet and TUSC, perfect for this app. Rather than having to expose credentials to this app, secure request prompts will be sent to the BEET wallet for you to manually approve, significantly reducing risk for all parties.',
    },
    {
      key: 'how_tickets',
      control: 'How do I create a ticket?',
      panel: 'You can either create a ticket via the "create ticket" page, or within each blockchains reference wallet voting page. There are 4 ticket types; 180 days, 360 days, 720 days, and forever. The greater the lock duration the larger the ticket value boost you receive, subsequently increasing both your voting weight and your accounts airdrop surface area.',
    },
    {
      key: 'why_ticket',
      control: 'Why should I create a ticket?',
      panel: 'There are multiple reasons to create blockchain tickets, such as gaining voting rights over witnesses, committee and worker proposal outcome, as well as becoming a target for potential future airdrops!',
    },
    {
      key: 'how_undo_ticket',
      control: 'How do I get my tokens out of a ticket?',
      panel: 'If your ticket has less than forever duration, then you can trigger a ticket withdrawal via the reference wallet. The contained tokens will become liquid once the specified ticket duration has passed.',
    },
    {
      key: 'how_report_issue',
      control: 'How can I report an issue with this tool?',
      panel: 'Please report issues to the github repo.',
    },
    {
      key: 'fees',
      control: 'What are the blockchain fees associated with airdrops?',
      panel: 'Airdrop fee cost will increase if there are many airdrop recipients. Fees are set by blockchain committees and can change over time as their marketcap changes, so plan ahead for additional tokens to account for fees associated with airdrops. This tool will batch airdrop recipients together to reduce fees.',
    },
    {
      key: 'ltm',
      control: 'How can I reduce the fees associated with performing an airdrop?',
      panel: 'You can purchase a Life-Time Membership (LTM) for approx $100 in the reference web app, this will effectively reduce fees by 80%',
    },
    {
      key: 'license',
      control: 'Is this tool open source? What is its license?',
      panel: 'This tool is fully open source, available on Github and is MIT licensed. Do not pay for this software.',
    },
    {
      key: 'missing_tickets',
      control: 'I am unable to find my new ticket',
      panel: 'This tool does not automatically update fetched tickets; if new tickets have been created then you must manually use the ticket fetch feature to update the blockchain tickets and leaderboard in this tool.',
    },
    {
      key: 'new_algos',
      control: 'I have an idea for an airdrop calculation algorithm, can it be included?',
      panel: 'Since this tool is fully open source, create an issue with the idea and potentially create a pull request to get the new algorithm included. Alternatively you can fork this software for your own use without having to merge the code back into the main parent fork.',
    },
    {
      key: 'alternative_wallet',
      control: 'Can I use another wallet other then the BEET multiwallet?',
      panel: 'This tool currently only works with the BEET multiwallet for performing airdrops. Recipients of airdrops can use any wallet however.',
    },
  ];

  return (
    <Container size="sm">
      <Title order={2} ta="center" mt="sm" style={{ marginBottom: '20px' }}>
        Frequently Asked Questions
      </Title>

      <Accordion variant="separated">
        {
                    contents.map((item) => (
                      <Accordion.Item value={item.key}>
                        <Accordion.Control>{item.control}</Accordion.Control>
                        <Accordion.Panel>{item.panel}</Accordion.Panel>
                      </Accordion.Item>
                    ))
                }

      </Accordion>
    </Container>
  );
}
