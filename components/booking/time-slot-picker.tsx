"use client";

import { useMemo, useState } from "react";

type TimeSlotPickerProps = Readonly<{
  label: string;
  description: string;
  dateLabel: string;
  slotLabel: string;
  requiredLabel: string;
  noSlotsLabel: string;
  helperText: string;
}>;

const weekdayHours = { start: 8, end: 18 };
const saturdayHours = { start: 9, end: 16 };

function getSlotsForDate(date: string) {
  if (!date) {
    return [];
  }

  const selectedDate = new Date(`${date}T00:00:00`);
  const day = selectedDate.getDay();

  if (day === 0) {
    return [];
  }

  const hours = day === 6 ? saturdayHours : weekdayHours;
  const slots: string[] = [];

  for (let hour = hours.start; hour < hours.end; hour += 1) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  return slots;
}

export function TimeSlotPicker({
  label,
  description,
  dateLabel,
  slotLabel,
  requiredLabel,
  noSlotsLabel,
  helperText,
}: TimeSlotPickerProps) {
  const [date, setDate] = useState("");
  const slots = useMemo(() => getSlotsForDate(date), [date]);

  return (
    <fieldset className="mb-8">
      <legend className="text-sm font-bold text-slate-800">
        {label}
        <span className="ml-1 text-sky-700">{requiredLabel}</span>
      </legend>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      <label className="mt-4 grid gap-2">
        <span className="text-sm font-bold text-slate-800">
          {dateLabel}
          <span className="ml-1 text-sky-700">{requiredLabel}</span>
        </span>
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          name="requestedDate"
          onChange={(event) => setDate(event.target.value)}
          required
          type="date"
          value={date}
        />
      </label>

      <div className="mt-5">
        <p className="text-sm font-bold text-slate-800">
          {slotLabel}
          <span className="ml-1 text-sky-700">{requiredLabel}</span>
        </p>

        {slots.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {slots.map((slot) => (
              <label
                className="cursor-pointer rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-900 transition hover:border-sky-300 hover:bg-sky-50/50"
                key={slot}
              >
                <input
                  className="sr-only"
                  name="requestedTime"
                  required
                  type="radio"
                  value={slot}
                />
                {slot}
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
            {noSlotsLabel}
          </p>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">{helperText}</p>
    </fieldset>
  );
}
