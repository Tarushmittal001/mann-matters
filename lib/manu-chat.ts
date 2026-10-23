/**
 * One Manu: the on-site chat (components/tools/ChatAssistant.tsx).
 *
 * Every "Talk to Manu" button opens that chat rather than linking somewhere
 * else. There used to be three Manus — a WhatsApp link to the team's number,
 * the floating chat and the home-page demo — and a visitor could not tell
 * which one would answer. The chat listens for this event; anything that wants
 * to open it dispatches the event and needs no reference to the component.
 */
export const OPEN_MANU_EVENT = "emoraa:open-manu";

export function openManuChat() {
  window.dispatchEvent(new Event(OPEN_MANU_EVENT));
}
