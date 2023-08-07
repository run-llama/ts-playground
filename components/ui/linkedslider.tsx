import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { ChangeEvent, useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface LinkedSliderProps {
  className?: string;
  label: string;
  description?: string;
  min: number;
  max: number;
  step: number;
  value: string;
  onChange: (value: string) => void;
}

/**
 * A slider, input, and label that are linked together.
 * @param props
 * @returns
 */
const LinkedSlider = ({
  className,
  label,
  description,
  min,
  max,
  step,
  value,
  onChange,
}: LinkedSliderProps) => {
  const inputId = useId();

  return (
    <div className={className}>
      <div className="space-x-2">
        <Label htmlFor={inputId}>{label}</Label>
        <Popover>
          <PopoverTrigger>
            <QuestionMarkCircledIcon className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent>{description}</PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-row space-x-2">
        <Slider
          value={[parseFloat(value)]}
          min={min}
          max={max}
          step={step}
          onValueChange={(values: number[]) => {
            onChange(values[0].toString());
          }}
        />
        <Input
          id={inputId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
          }}
          className="max-w-[100px]"
        />
      </div>
    </div>
  );
};

export { LinkedSlider };
