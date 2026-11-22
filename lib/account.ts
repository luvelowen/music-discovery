'use client';

import { deleteProfile } from './profile/store.ts';
import { deleteSocial } from './social/store.ts';

/** Deletion must cover every kind of saved data. Add new stores here. */
export function deleteEverything() {
  deleteProfile();
  deleteSocial();
}
