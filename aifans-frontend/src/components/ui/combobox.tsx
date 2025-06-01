"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  allowCustomValue?: boolean;
  className?: string;
}

export function Combobox({
  value = "",
  onValueChange,
  options,
  placeholder = "选择或输入...",
  allowCustomValue = false,
  className,
}: ComboboxProps) {
  const [isCustom, setIsCustom] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  // 检查当前值是否在选项列表中
  const isValueInOptions = options.some((option) => option.value === value);

  React.useEffect(() => {
    if (value && !isValueInOptions && allowCustomValue) {
      setIsCustom(true);
      setCustomValue(value);
    }
  }, [value, isValueInOptions, allowCustomValue]);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "__custom__") {
      setIsCustom(true);
      setCustomValue("");
      onValueChange?.("");
    } else {
      setIsCustom(false);
      setCustomValue("");
      onValueChange?.(selectedValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onValueChange?.(newValue);
  };

  if (isCustom) {
    return (
      <div className={className}>
        <Input
          value={customValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          onBlur={() => {
            if (!customValue && options.length > 0) {
              setIsCustom(false);
            }
          }}
        />
        {options.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              setCustomValue("");
              onValueChange?.("");
            }}
            className="text-xs text-muted-foreground mt-1 hover:underline"
          >
            从列表选择
          </button>
        )}
      </div>
    );
  }

  return (
    <Select value={value || ""} onValueChange={handleSelectChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {allowCustomValue && (
          <>
            <div className="border-t my-1" />
            <SelectItem value="__custom__">
              <span className="text-muted-foreground">自定义输入...</span>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
} 