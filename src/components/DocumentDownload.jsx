import React from "react";
export function DocumentDownload({
  title,
  description,
  format,
  disabled,
  onDownload,
}) {
  return (
    <div className="doc">
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="secondary" disabled={disabled} onClick={onDownload}>
        Descargar {format}
      </button>
    </div>
  );
}
