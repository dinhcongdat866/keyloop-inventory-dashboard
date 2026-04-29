import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ActionType } from '@/types/action';
import { ACTION_TYPE_META, ACTION_TYPES } from '@/constants/actionTypes';
import { useAddAction } from '@/hooks/useAddAction';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  type: z.enum(ACTION_TYPES as [ActionType, ...ActionType[]]),
  note: z.string().trim().max(500, 'Note must be 500 characters or less').optional(),
});

type FormValues = z.infer<typeof schema>;

type AddActionFormProps = {
  dealershipId: string;
  carId: string;
  onSuccess?: () => void;
};

export function AddActionForm({ dealershipId, carId, onSuccess }: AddActionFormProps) {
  const mutation = useAddAction();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PRICE_REDUCTION_PLANNED', note: '' },
  });

  const selectedType = useWatch({ control, name: 'type' });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(
      {
        dealershipId,
        carId,
        payload: { type: values.type, note: values.note?.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success('Action logged');
          reset();
          onSuccess?.();
        },
        onError: (err) => {
          toast.error('Failed to log action', { description: err.message });
        },
      }
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="action-type">Action type</Label>
        <Select
          value={selectedType}
          onValueChange={(v) => setValue('type', v as ActionType, { shouldValidate: true })}
        >
          <SelectTrigger id="action-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ACTION_TYPE_META[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-xs text-destructive">{errors.type.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="action-note">Note (optional)</Label>
        <Textarea
          id="action-note"
          rows={3}
          placeholder="Add context for this action…"
          {...register('note')}
        />
        {errors.note && (
          <p className="text-xs text-destructive">{errors.note.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save action'}
        </Button>
      </div>
    </form>
  );
}
