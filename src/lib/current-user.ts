"use client";

import { createContext, useContext } from "react";

export interface CurrentUser {
  id: string;
  name: string;
  isAdmin: boolean;
}

export const GUEST_USER: CurrentUser = {
  id: "",
  name: "Guest",
  isAdmin: false,
};

export function isGuest(user: CurrentUser) {
  return user.id === "";
}

export const CurrentUserContext = createContext<CurrentUser>(GUEST_USER);

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
