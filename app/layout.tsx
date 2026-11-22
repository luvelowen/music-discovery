import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/layout/app-shell';
import { AccountProvider } from '@/lib/account/provider';
import { ChatProvider } from '@/lib/chat/provider';
import { PeopleProvider } from '@/lib/people/provider';
import { I18nProvider } from '@/lib/i18n/provider';
import { getI18n } from '@/lib/i18n/server';
import { emailCheckedAt, toAccount } from '@/lib/server/accounts';
import { getDb } from '@/lib/server/db';
import { currentUser } from '@/lib/server/session';
import './globals.css';

// Apple devices use their own system font. Everyone else gets Inter, which really contains Ө ө Ү ү.
const inter = Inter({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], variable: '--font-inter' });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.appName, template: `%s | ${t.appName}` },
    description: `${t.welcome.title} ${t.welcome.body}`,
    robots: { index: false, follow: false }, // Until the launch checklist is done.
  };
}

export const viewport: Viewport = { themeColor: '#0c0c0e', viewportFit: 'cover', interactiveWidget: 'resizes-content' };

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [{ locale }, user] = await Promise.all([getI18n(), currentUser()]);
  return (
    <html lang={locale} className={inter.variable}>
      <body className="flex min-h-dvh flex-col font-sans">
        <I18nProvider initialLocale={locale}>
          {/* Only this person's own data is passed on, and never the password's scrambled value. */}
          <AccountProvider user={user ? { id: user.id, email: user.email, emailChecked: emailCheckedAt(getDb(), user.id) !== null, account: toAccount(user) } : null}>
            <PeopleProvider>
              <ChatProvider>
                <AppShell>{children}</AppShell>
              </ChatProvider>
            </PeopleProvider>
          </AccountProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
