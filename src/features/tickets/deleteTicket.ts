import { deleteDoc, doc } from "firebase/firestore";
import { getTicketsCollection } from "./getTicketsCollection";

export const deleteTicket = async (id: string): Promise<void> => {
  await deleteDoc(doc(getTicketsCollection(), id));
};
