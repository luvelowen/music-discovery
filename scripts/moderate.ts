import { databaseFile, openDatabase } from '../lib/server/db.ts';
import * as moderation from '../lib/server/moderation.ts';

/*
 * The moderator's tool. It runs only on the computer that holds the database.
 *   npm run moderate                        open reports, most urgent first
 *   npm run moderate -- show <report>       one report, with any messages the reporter attached
 *   npm run moderate -- suspend <report>    suspend the reported person, then close the report
 *   npm run moderate -- close <report>      close without suspending
 *   npm run moderate -- suspended           who is suspended
 *   npm run moderate -- restore <user id>   lift a suspension
 */
const [command = 'list', argument = ''] = process.argv.slice(2);
const db = openDatabase(databaseFile());
const when = (time: number) => new Date(time).toISOString().slice(0, 16).replace('T', ' ');
// What people type must not be able to control the moderator's terminal.
const safe = (text: string) => text.replace(/[\p{Cc}\p{Bidi_Control}]/gu, ' ');

function report() {
  const found = moderation.findReport(db, argument);
  if (found) return found;
  console.log('No single report starts with that id. Use at least 6 characters from the list.');
  process.exit(1);
}

switch (command) {
  case 'list': {
    const reports = moderation.openReports(db);
    if (!reports.length) console.log('No open reports.');
    for (const item of reports) {
      console.log(`${item.id.slice(0, 8)}  ${when(item.created_at)} UTC  ${item.reason}  ${safe(item.reported_name)}${item.evidence ? '  (messages attached)' : ''}`);
    }
    break;
  }
  case 'show': {
    const item = report();
    console.log(`Report ${item.id}\nAbout: ${safe(item.reported_name)} (${item.reported_id})\nReason: ${item.reason}\nWhen: ${when(item.created_at)} UTC\nDetails: ${safe(item.details) || '-'}`);
    for (const message of JSON.parse(item.evidence ?? '[]') as { from: string; text: string; at: number }[]) {
      console.log(`  ${when(message.at)}  ${message.from}: ${safe(message.text)}`);
    }
    break;
  }
  case 'suspend': {
    const item = report();
    const done = moderation.suspend(db, item.reported_id, item.reason);
    moderation.closeReport(db, item.id);
    console.log(done ? `Suspended ${item.reported_id} and closed the report.` : 'That account no longer exists. Closed the report.');
    break;
  }
  case 'close':
    moderation.closeReport(db, report().id);
    console.log('Closed.');
    break;
  case 'suspended': {
    const list = moderation.suspended(db);
    if (!list.length) console.log('No one is suspended.');
    for (const item of list) console.log(`${item.user_id}  ${when(item.at)} UTC  ${item.reason}`);
    break;
  }
  case 'restore':
    console.log(moderation.restore(db, argument) ? 'Restored.' : 'That user id is not suspended.');
    break;
  default:
    console.log('Commands: list, show, suspend, close, suspended, restore');
}
db.close();
