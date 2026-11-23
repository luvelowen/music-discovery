import { databaseFile, openDatabase } from '../lib/server/db.ts';
import * as moderation from '../lib/server/moderation.ts';

/*
 * The moderator's tool. It runs only on the computer that holds the database.
 *   npm run moderate                        open reports, most urgent first
 *   npm run moderate -- show <report>       one report, with any messages the reporter attached
 *   npm run moderate -- suspend <report>    suspend the reported person. The report and its evidence stay
 *   npm run moderate -- close <report>      close a report that has no messages attached
 *   npm run moderate -- close <report> erase    close it and erase the attached messages for good
 *   npm run moderate -- suspended           who is suspended
 *   npm run moderate -- restore <user id>   lift a suspension
 */
const [command = 'list', argument = '', confirmation = ''] = process.argv.slice(2);
const db = openDatabase(databaseFile());
const when = (time: number) => new Date(time).toISOString().slice(0, 16).replace('T', ' ');
// What people type must not be able to control the moderator's terminal.
const safe = (text: string) => text.replace(/[\p{Cc}\p{Bidi_Control}]/gu, ' ');
const nameOf = (item: moderation.ReportRow) => safe(item.reported_name || moderation.nameNow(db, item.reported_id) || '(deleted account)');

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
      const marks = `${item.evidence ? '  (messages attached)' : ''}${moderation.isSuspended(db, item.reported_id) ? '  (suspended)' : ''}`;
      console.log(`${item.id.slice(0, 8)}  ${when(item.created_at)} UTC  ${item.reason}  ${nameOf(item)}${marks}`);
    }
    break;
  }
  case 'show': {
    const item = report();
    console.log(`Report ${item.id}\nAbout: ${nameOf(item)} (${item.reported_id})\nReason: ${item.reason}\nWhen: ${when(item.created_at)} UTC\nDetails: ${safe(item.details) || '-'}`);
    for (const message of JSON.parse(item.evidence ?? '[]') as { from: string; text: string; at: number }[]) {
      console.log(`  ${when(message.at)}  ${message.from}: ${safe(message.text)}`);
    }
    break;
  }
  case 'suspend': {
    const item = report();
    const done = moderation.suspend(db, item.reported_id, item.reason);
    console.log(done ? `Suspended ${item.reported_id}.` : 'That account no longer exists, so there was nothing to suspend.');
    console.log('The report is still open, with everything attached to it.');
    if (item.reason === 'underage' || item.reason === 'danger') console.log('Suspending is not reporting. If a child or anyone is in danger, tell the police or child helpline now.');
    break;
  }
  case 'close': {
    const item = report();
    if (item.evidence && confirmation !== 'erase') {
      console.log('Not closed. Closing erases the attached messages for good, and the police may need them.');
      console.log(`Only if they are no longer needed: npm run moderate -- close ${item.id.slice(0, 8)} erase`);
      process.exitCode = 1;
      break;
    }
    moderation.closeReport(db, item.id);
    console.log(item.evidence ? 'Closed. The attached messages were erased.' : 'Closed.');
    break;
  }
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
