import React from "react";
export function SignedFileInput({ label, disabled, file, onAttach }) {
  return (
    <label className="upload">
      <b>{label}</b>
      <input
        aria-label={label}
        disabled={disabled}
        type="file"
        accept=".pdf,.p7m"
        onChange={(e) => onAttach(e.target.files[0])}
      />
      {file && (
        <small className="attached">
          ✓ {file.name} · {(file.size / 1024).toFixed(0)} KB
        </small>
      )}
    </label>
  );
}
