import React, { useEffect, useRef } from "react";
import {
  annexFields,
  annexValues,
  benefits,
  missingAnnex,
} from "../domain/annexFields.js";

export function Choice({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Pendiente de confirmar</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
