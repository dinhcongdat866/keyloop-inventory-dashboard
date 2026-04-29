import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AgingPolicy } from '@/types/aging';
import {
  AGING_POLICY_BOUNDS,
  AGING_POLICY_PRESETS,
  DEFAULT_AGING_POLICY,
} from '@/constants/aging';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type FieldErrors = Partial<Record<keyof AgingPolicy, string>>;

function validate(p: AgingPolicy): FieldErrors {
  const errors: FieldErrors = {};
  const { min, max } = AGING_POLICY_BOUNDS;

  for (const key of ['approachingDays', 'agingDays', 'criticalDays'] as const) {
    const v = p[key];
    if (!Number.isInteger(v) || v < min || v > max) {
      errors[key] = `Must be an integer between ${min} and ${max}`;
    }
  }
  if (!errors.agingDays && !errors.approachingDays && p.agingDays <= p.approachingDays) {
    errors.agingDays = 'Must be greater than Approaching';
  }
  if (!errors.criticalDays && !errors.agingDays && p.criticalDays <= p.agingDays) {
    errors.criticalDays = 'Must be greater than Aging';
  }
  return errors;
}

type AgingPolicySettingsProps = {
  policy: AgingPolicy;
  setPolicy: (policy: AgingPolicy) => void;
  resetPolicy: () => void;
};

export function AgingPolicySettings({
  policy,
  setPolicy,
  resetPolicy,
}: AgingPolicySettingsProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AgingPolicy>(policy);
  const errors = validate(draft);
  const hasErrors = Object.keys(errors).length > 0;

  // Re-sync draft when popover opens (in case external change)
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(policy);
    setOpen(next);
  };

  const updateField = (key: keyof AgingPolicy, value: string) => {
    const n = Number(value);
    setDraft((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
  };

  const handleSave = () => {
    if (hasErrors) return;
    setPolicy(draft);
    toast.success('Aging policy updated');
    setOpen(false);
  };

  const handleReset = () => {
    setDraft(DEFAULT_AGING_POLICY);
    resetPolicy();
    toast.success('Aging policy reset to default');
  };

  const applyPreset = (preset: AgingPolicy) => setDraft(preset);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'gap-1.5'
        )}
        aria-label="Aging policy settings"
      >
        <Settings2 className="size-3.5" />
        <span className="hidden sm:inline">Settings</span>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold">Aging thresholds</h4>
            <p className="text-xs text-muted-foreground">
              Days in stock before a vehicle reaches each tier.
            </p>
          </div>

          <div className="space-y-2">
            <Field
              label="Approaching"
              hint="early warning"
              value={draft.approachingDays}
              error={errors.approachingDays}
              onChange={(v) => updateField('approachingDays', v)}
            />
            <Field
              label="Aging"
              hint="over threshold"
              value={draft.agingDays}
              error={errors.agingDays}
              onChange={(v) => updateField('agingDays', v)}
            />
            <Field
              label="Critical"
              hint="needs urgent action"
              value={draft.criticalDays}
              error={errors.criticalDays}
              onChange={(v) => updateField('criticalDays', v)}
            />
          </div>

          <div>
            <p className="mb-1 text-xs text-muted-foreground">Presets</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(AGING_POLICY_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(preset)}
                >
                  {key.replace(/_/g, ' ').toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-2 border-t pt-3">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={hasErrors}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Field({
  label,
  hint,
  value,
  error,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `aging-${label.toLowerCase()}`;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <Input
        id={id}
        type="number"
        min={AGING_POLICY_BOUNDS.min}
        max={AGING_POLICY_BOUNDS.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className="h-8"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
