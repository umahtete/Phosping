/**
 * User Profile Store
 * Persists avatar, nickname & bio to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Predefined avatar options */
export const AVATAR_OPTIONS = [
  '/avatars/learner.svg',
  '/avatars/scholar.svg',
  '/avatars/prof-amara.svg',
  '/avatars/samir.svg',
  '/avatars/carlos.svg',
  '/avatars/yuki.svg',
  '/avatars/priya.svg',
  '/avatars/fatima.svg',
] as const;

export interface UserProfileState {
  /** Local avatar path or data-URL (for custom uploads) */
  avatar: string;
  nickname: string;
  bio: string;
  setAvatar: (avatar: string) => void;
  setNickname: (nickname: string) => void;
  setBio: (bio: string) => void;
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      avatar: AVATAR_OPTIONS[0],
      nickname: '',
      bio: '',
      setAvatar: (avatar) => set({ avatar }),
      setNickname: (nickname) => set({ nickname }),
      setBio: (bio) => set({ bio }),
    }),
    {
      name: 'user-profile-storage',
    },
  ),
);
