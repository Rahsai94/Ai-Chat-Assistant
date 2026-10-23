import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Chat Assistant/);
});

test('can navigate to chat and send message', async ({ page }) => {
  // Route mock to avoid using actual API
  await page.route('/api/chat', async (route) => {
    // Mock SSE response
    const streamBody =
      `data: {"conversationId": "test-conv-123"}\n\n` +
      `data: {"text": "Hello "}\n\n` +
      `data: {"text": "this is a mock "}\n\n` +
      `data: {"text": "response."}\n\n`;

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: streamBody
    });
  });

  await page.goto('/');
  await page.click('text=Start Chatting');

  // Check we are on chat page and empty state shows
  await expect(page.locator('textarea')).toBeVisible();
  await expect(page.getByText('How can I help you today?')).toBeVisible();

  // Send a message
  await page.fill('textarea', 'Hello AI!');

  // We expect the 'Send message' button
  await page.click('button[aria-label="Send message"]');

  // Verify optimistic UI for user message
  await expect(page.getByText('Hello AI!')).toBeVisible();

  // Verify AI response from mock
  await expect(page.getByText(/Hello this is a mock response\./i)).toBeVisible();
});

test('can open sidebar and clear chat', async ({ page }) => {
  await page.goto('/chat');

  // In mobile, we'd need to click toggle, in desktop it's there.
  // We use a general selector
  const newChatBtn = page.getByRole('button', { name: /New Chat/i }).first();
  await expect(newChatBtn).toBeVisible();

  await page.fill('textarea', 'Temp msg');
  await page.click('button[aria-label="Send message"]');

  // Clear chat
  await newChatBtn.click();

  // Should return to welcome screen
  await expect(page.getByText('How can I help you today?')).toBeVisible();
});
