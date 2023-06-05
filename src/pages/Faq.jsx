import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Container, Title, Accordion } from '@mantine/core';

export default function FAQ(properties) {
  const { t, i18n } = useTranslation();
  const faqContent = [
    'how_airdrop',
    'why_beet',
    'how_tickets',
    'why_ticket',
    'how_undo_ticket',
    'how_report_issue',
    'fees',
    'ltm',
    'license',
    'missing_tickets',
    'new_algos',
    'alternative_wallet'
  ];

  const contents = faqContent.map((x) => ({
    key: x,
    control: t(`faq:${x}.control`),
    panel: t(`faq:${x}.panel`)
  }));

  return (
    <Container size="sm">
      <Title order={2} ta="center" mt="sm" style={{ marginBottom: '20px' }}>
        {t("faq:title")}
      </Title>

      <Accordion variant="separated">
        {
            contents.map((item) => (
              <Accordion.Item key={`acc_${item.key}`} value={item.key}>
                <Accordion.Control>{item.control}</Accordion.Control>
                <Accordion.Panel>{item.panel}</Accordion.Panel>
              </Accordion.Item>
            ))
        }
      </Accordion>
    </Container>
  );
}
