import { useMyChildren } from "../hooks/useAccessScope";

export default function FamilySync() {
  useMyChildren(true);
  return null;
}