type Option<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string = string> = {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  placeholder?: string;
  disabled?: boolean;
};

export default function Select<T extends string = string>({
  label,
  value,
  onChange,
  options,
  placeholder = "-- izaberi --",
  disabled,
}: Props<T>) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
