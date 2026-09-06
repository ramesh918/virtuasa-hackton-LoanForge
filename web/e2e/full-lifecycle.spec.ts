import { test, expect } from '@playwright/test';
import {
  closeFixtureConnection,
  insertApplicantProfile,
  insertOffer,
  setApplicationState,
  uniqueApplicantAndProduct,
} from './db-fixtures';

const API_BASE_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

test.afterAll(async () => {
  await closeFixtureConnection();
});

async function login(page: import('@playwright/test').Page, role: 'applicant' | 'underwriter', applicantId?: string) {
  await page.goto('/login');
  await page.selectOption('select', role);
  if (applicantId) {
    await page.fill('input', applicantId);
  }
  await page.click('button:has-text("Continue")');
}

test('applicant applies for a loan and is automatically evaluated into UNDER_REVIEW [AC-01]', async ({
  page,
  request,
}) => {
  const { applicantId, productId } = uniqueApplicantAndProduct();
  // ApplyPage triggers PATCH /applications/:id/evaluate right after submit (see
  // specs/eligibility_spec.md's orchestration entry point) — a seeded profile is required for
  // eligibility to pass deterministically instead of racing an unseeded auto-reject.
  await insertApplicantProfile(applicantId);
  await login(page, 'applicant', applicantId);

  await page.selectOption('select >> nth=0', productId);
  await page.locator('input').nth(0).fill('4000.00');
  await page.locator('input[type="number"]').fill('12');
  await page.locator('input').nth(2).fill('e2e test purpose');
  await page.locator('input').nth(3).fill('5200.00');
  await page.selectOption('select >> nth=1', 'SALARIED');
  await page.click('button:has-text("Submit application")');

  await page.waitForURL('**/applications/*');
  await expect(page.locator('.status-badge')).toHaveText('UNDER_REVIEW', { timeout: 10000 });

  const applicationId = page.url().split('/applications/')[1];
  const response = await request.get(`${API_BASE_URL}/applications/${applicationId}`, {
    headers: { 'x-role': 'applicant', 'x-applicant-id': applicantId },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).state).toBe('UNDER_REVIEW');
});

test('underwriter approves a queued application from the real UI [AC-07]', async ({ page, request }) => {
  const { applicantId, productId } = uniqueApplicantAndProduct();
  const submitRes = await request.post(`${API_BASE_URL}/applications`, {
    headers: { 'x-role': 'applicant', 'x-applicant-id': applicantId },
    data: {
      applicantId,
      productId,
      amount: '4000.00',
      tenureMonths: 12,
      purpose: 'e2e test purpose',
      income: '5200.00',
      employmentType: 'SALARIED',
    },
  });
  const { applicationId } = await submitRes.json();
  await setApplicationState(applicationId, 'UNDER_REVIEW');

  await login(page, 'underwriter');
  await page.waitForURL('**/queue');
  await expect(page.getByText(applicationId)).toBeVisible();
  await page.click(`li:has-text("${applicationId}") >> button:has-text("Approve")`);

  await expect(page.getByText(applicationId)).not.toBeVisible();

  const statusRes = await request.get(`${API_BASE_URL}/applications/${applicationId}`, {
    headers: { 'x-role': 'underwriter' },
  });
  expect((await statusRes.json()).state).toBe('APPROVED');
});

test('applicant views and accepts a priced offer, reaching DISBURSED [AC-08]', async ({ page, request }) => {
  const { applicantId, productId } = uniqueApplicantAndProduct();
  const submitRes = await request.post(`${API_BASE_URL}/applications`, {
    headers: { 'x-role': 'applicant', 'x-applicant-id': applicantId },
    data: {
      applicantId,
      productId,
      amount: '4000.00',
      tenureMonths: 12,
      purpose: 'e2e test purpose',
      income: '5200.00',
      employmentType: 'SALARIED',
    },
  });
  const { applicationId } = await submitRes.json();
  await insertApplicantProfile(applicantId);
  await setApplicationState(applicationId, 'APPROVED');
  await insertOffer(applicationId, 12);

  await login(page, 'applicant', applicantId);
  await page.goto(`/applications/${applicationId}`);
  await expect(page.locator('.status-badge')).toHaveText('APPROVED');

  await page.click('text=View offer');
  await expect(page.getByText('Monthly EMI')).toBeVisible();
  await page.click('button:has-text("Accept offer")');

  await page.waitForURL(`**/applications/${applicationId}`);
  await expect(page.locator('.status-badge')).toHaveText('DISBURSED');
});
