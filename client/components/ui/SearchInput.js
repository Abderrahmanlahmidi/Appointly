"use client";

import React from "react";
import { Search } from "lucide-react";
import Input from "./Input";

const normalizeValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase();
};

const resolveFieldValue = (item, field) => {
  if (typeof field === "function") return field(item);
  if (!field) return "";
  return item?.[field];
};

export default function SearchInput({
  data = [],
  fields = [],
  filterFn,
  onResults,
  onQueryChange,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Search...",
  className = "",
  inputClassName = "",
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const query = value !== undefined ? value : internalValue;

  const filteredData = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return data;

    if (typeof filterFn === "function") {
      return data.filter((item) => filterFn(item, term));
    }

    const hasFields = Array.isArray(fields) && fields.length > 0;
    return data.filter((item) => {
      if (hasFields) {
        return fields.some((field) =>
          normalizeValue(resolveFieldValue(item, field)).includes(term)
        );
      }
      return Object.values(item ?? {}).some((value) =>
        normalizeValue(value).includes(term)
      );
    });
  }, [data, query, filterFn, fields]);

  React.useEffect(() => {
    onResults?.(filteredData, query);
  }, [filteredData, onResults, query]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onQueryChange?.(nextValue);
    onChange?.(event);
  };

  return (
    <Input
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
      icon={Search}
      className={className}
      inputClassName={inputClassName}
    />
  );
}
