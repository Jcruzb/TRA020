import React, { useEffect, useRef } from "react";
import {
  annexFields,
  annexValues,
  benefits,
  missingAnnex,
} from "../domain/annexFields.js";

export function ConfirmIncomplete({ missing, onCancel, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    const el = dialog.current;
    const handle = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
      if (e.key === "Tab") {
        const buttons = el.querySelectorAll("button");
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", handle);
    return () => el.removeEventListener("keydown", handle);
  }, [onCancel]);
  return (
    <div className="modal-backdrop">
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="modal"
      >
        <h2 id="confirm-title">
          ¿Descargar el Anexo I con apartados en blanco?
        </h2>
        <p>
          Quedan {missing.length} datos por completar. El cliente podrá
          escribirlos en el PDF editable antes de firmarlo.
        </p>
        <ul className="missing-list">
          {missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <div className="actions">
          <button className="secondary" autoFocus onClick={onCancel}>
            Volver a completar
          </button>
          <button onClick={onConfirm}>
            Sí, descargar con campos en blanco
          </button>
        </div>
      </section>
    </div>
  );
}
