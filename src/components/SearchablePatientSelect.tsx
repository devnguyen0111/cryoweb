import { useState } from "react";

type Patient = any;

interface Props {
  patients: Patient[];
  value?: string;
  onSelect: (patient: Patient) => void;
  placeholder?: string;
}

export function SearchablePatientSelect({
  patients,
  value,
  onSelect,
  placeholder = "Search patient by code or name",
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);

  const filtered =
    keyword.trim() === ""
      ? patients.slice(0, 5)
      : patients.filter((p) => {
          const text = `${p.patientCode} ${p.accountInfo?.firstName} ${p.accountInfo?.lastName}`.toLowerCase();
          return text.includes(keyword.toLowerCase());
        });

  return (
    <div className="relative">
      <input
        value={value ? value : keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow max-h-60 overflow-auto">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="px-4 py-2 cursor-pointer hover:bg-blue-50"
              onClick={() => {
                onSelect(p);
                setKeyword(
                  `${p.patientCode} – ${p.accountInfo?.firstName} ${p.accountInfo?.lastName}`
                );
                setOpen(false);
              }}
            >
              <div className="font-medium">
                {p.patientCode}
              </div>
              <div className="text-sm text-gray-500">
                {p.accountInfo?.firstName} {p.accountInfo?.lastName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
