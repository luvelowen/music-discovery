/** Who runs this copy of the app. Set in .env.local. Shown on the privacy page. */
export function operator() {
  return {
    name: process.env.APP_OPERATOR?.trim() || null,
    contact: process.env.APP_CONTACT?.trim() || null,
    location: process.env.APP_DATA_LOCATION?.trim() || null,
  };
}

/** A public address must say who holds people's data, where, and how to reach them, before anyone can join. */
export function canTakeSignUps() {
  if (!process.env.APP_HOSTS) return true; // Only this computer can reach it.
  const { name, contact, location } = operator();
  return Boolean(name && contact && location);
}
