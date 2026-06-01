import React, { useEffect, useMemo, useState } from "react";
import { Bug, GripVertical, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import type { Ticket, TicketState, TicketUrgency } from "../../types";
import { createTicket } from "./createTicket";
import { deleteTicket } from "./deleteTicket";
import { runTicketWriteWithTimeout } from "./runTicketWriteWithTimeout";
import { subscribeToTickets } from "./subscribeToTickets";
import { ticketStateOptions } from "./ticketStateOptions";
import { updateTicket } from "./updateTicket";

interface TicketsSlideProps {
  currentUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
}

export const TicketsSlide: React.FC<TicketsSlideProps> = ({ currentUser }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<TicketUrgency>(3);
  const [state, setState] = useState<TicketState>("backlog");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    return subscribeToTickets(
      (nextTickets) => {
        setTickets(nextTickets);
        setIsLoading(false);
        setErrorText("");
      },
      (error) => {
        setErrorText(error.message || "Could not subscribe to tickets.");
        setIsLoading(false);
      },
    );
  }, []);

  const ticketsByState = useMemo(() => {
    return ticketStateOptions.reduce<Record<TicketState, Ticket[]>>((acc, option) => {
      acc[option.value] = tickets
        .filter((ticket) => ticket.state === option.value)
        .sort((a, b) => b.urgency - a.urgency);
      return acc;
    }, {
      backlog: [],
      todo: [],
      doing: [],
      onreview: [],
      done: [],
    });
  }, [tickets]);

  const userLabel = currentUser.email || currentUser.displayName || currentUser.uid;

  const openCreateModal = () => {
    setEditingTicket(null);
    setDescription("");
    setUrgency(3);
    setState("backlog");
    setIsModalOpen(true);
  };

  const openEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setDescription(ticket.description);
    setUrgency(ticket.urgency);
    setState(ticket.state);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingTicket(null);
    setErrorText("");
  };

  const closeModalAfterSave = () => {
    setIsModalOpen(false);
    setEditingTicket(null);
    setErrorText("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setErrorText("Ticket description is required.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorText("");
      if (editingTicket) {
        await runTicketWriteWithTimeout(updateTicket({ id: editingTicket.id, description: trimmedDescription, urgency, state }));
      } else {
        await runTicketWriteWithTimeout(createTicket({
          description: trimmedDescription,
          urgency,
          state,
          user: userLabel,
          userId: currentUser.uid,
        }));
      }
      closeModalAfterSave();
    } catch (error: any) {
      setErrorText(error.message || "Ticket could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTicket) return;

    try {
      setIsSaving(true);
      setErrorText("");
      await runTicketWriteWithTimeout(deleteTicket(editingTicket.id));
      closeModalAfterSave();
    } catch (error: any) {
      setErrorText(error.message || "Ticket could not be deleted.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrop = async (event: React.DragEvent, nextState: TicketState) => {
    event.preventDefault();
    const ticketId = event.dataTransfer.getData("text/plain");
    const ticket = tickets.find((candidate) => candidate.id === ticketId);

    if (!ticket || ticket.state === nextState) {
      return;
    }

    try {
      setErrorText("");
      await runTicketWriteWithTimeout(updateTicket({ id: ticket.id, state: nextState }));
    } catch (error: any) {
      setErrorText(error.message || "Ticket state could not be updated.");
    }
  };

  return (
    <div className="space-y-5" id="tickets-slide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Tickets</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {isLoading ? "Loading tickets..." : `${tickets.length} active tickets across the board.`}
            </p>
          </div>
        </div>
      </div>

      {errorText && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-xs font-semibold text-red-800">
          {errorText}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-20">
        {ticketStateOptions.map((option) => (
          <section
            key={option.value}
            className="min-h-[28rem] bg-slate-100/80 border border-slate-200 rounded-2xl p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, option.value)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">{option.label}</h3>
              <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                {ticketsByState[option.value].length}
              </span>
            </div>

            <div className="space-y-2">
              {ticketsByState[option.value].map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", ticket.id)}
                  onClick={() => openEditModal(ticket)}
                  className="w-full text-left bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5">
                      U{ticket.urgency}
                    </span>
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed mt-2 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-3 truncate">{ticket.user}</p>
                </button>
              ))}

              {!isLoading && ticketsByState[option.value].length === 0 && (
                <div className="h-24 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Empty
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={openCreateModal}
        className="fixed right-6 bottom-24 z-40 w-14 h-14 rounded-full bg-slate-900 hover:bg-black text-white shadow-lg flex items-center justify-center cursor-pointer border border-slate-950"
        title="Create ticket"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingTicket ? "Edit ticket" : "Create ticket"}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {editingTicket ? editingTicket.user : userLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="w-full resize-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Urgency</span>
                <select
                  value={urgency}
                  onChange={(event) => setUrgency(Number(event.target.value) as TicketUrgency)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">State</span>
                <select
                  value={state}
                  onChange={(event) => setState(event.target.value as TicketState)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ticketStateOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              {editingTicket ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
