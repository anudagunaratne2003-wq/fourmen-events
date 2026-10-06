"use client";
import { useRef } from "react";
import { useFormStatus } from "react-dom";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  value?: string;
  /** Ask this before submitting, e.g. "Reject this payment?". Use for actions that are hard to undo. */
  confirm?: string;
  /** Extra line under the question. */
  confirmDetail?: string;
  /** Label of the confirming button in the dialog (defaults to the button's own text). */
  confirmLabel?: string;
  /** Styles the confirming button in red. */
  danger?: boolean;
  pendingText?: string;
};

/** A submit button that cannot be pressed twice: while the server is working every button in the
 *  form is disabled, and the one that was pressed shows a spinner. Optionally asks for confirmation. */
export default function SubmitButton({
  children, className = "", confirm, confirmDetail, confirmLabel, danger, pendingText = "Working…",
  name, value, disabled, onClick, ...rest
}: Props) {
  const { pending, data } = useFormStatus();
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  // With several buttons in one form (e.g. Approve / Reject), only the pressed one shows the spinner.
  const mine = pending && (!name || data?.get(name) === (value ?? ""));

  return (
    <>
      <button
        ref={button}
        type="submit"
        name={name}
        value={value}
        disabled={disabled || pending}
        aria-busy={mine || undefined}
        className={`${className} inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={(e) => {
          onClick?.(e);
          if (confirm && !e.defaultPrevented) { e.preventDefault(); dialog.current?.showModal(); }
        }}
        {...rest}
      >
        {mine && <Spinner />}
        {mine ? pendingText : children}
      </button>
      {confirm && (
        <dialog
          ref={dialog}
          className="m-auto w-[calc(100%-2rem)] max-w-sm border border-black/10 bg-white p-6 text-left text-black shadow-2xl backdrop:bg-black/40"
          onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
        >
          <p className="text-base font-medium normal-case tracking-normal">{confirm}</p>
          {confirmDetail && <p className="mt-2 text-sm normal-case tracking-normal text-black/60">{confirmDetail}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" autoFocus onClick={() => dialog.current?.close()}
              className="border border-black/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-black hover:border-black">Cancel</button>
            <button type="button"
              onClick={() => { dialog.current?.close(); const b = button.current; b?.form?.requestSubmit(b); }}
              className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white ${danger ? "bg-red-700 hover:bg-red-800" : "bg-black hover:bg-[#9b5b2b]"}`}>
              {confirmLabel ?? children}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
