import React, { useEffect, useRef } from "react";
import {
  annexFields,
  annexValues,
  benefits,
  missingAnnex,
} from "../domain/annexFields.js";

export function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
