import { formatDistanceToNowStrict } from 'date-fns';
import type { EnrichedCar } from '@/types/aging';
import type { ActionLog } from '@/types/action';
import { ACTION_TYPE_META } from '@/constants/actionTypes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AddActionForm } from './AddActionForm';
import { formatCurrency } from '@/lib/utils/format';

type ActionsModalProps = {
  car: EnrichedCar | null;
  dealershipId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ActionLogItem({ log }: { log: ActionLog }) {
  const meta = ACTION_TYPE_META[log.type];
  const isPending = log.id.startsWith('temp-');
  return (
    <li className="rounded-md border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{meta.label}</p>
          {log.note && <p className="mt-1 text-sm text-muted-foreground">{log.note}</p>}
        </div>
        {isPending && (
          <Badge variant="secondary" className="text-xs">
            Saving…
          </Badge>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatDistanceToNowStrict(new Date(log.createdAt), { addSuffix: true })} · by{' '}
        {log.createdBy}
      </p>
    </li>
  );
}

function ActionHistory({ logs }: { logs: ActionLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        No actions logged yet.
      </p>
    );
  }
  // Newest first
  const sorted = [...logs].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto">
      {sorted.map((log) => (
        <ActionLogItem key={log.id} log={log} />
      ))}
    </ul>
  );
}

export function ActionsModal({ car, dealershipId, open, onOpenChange }: ActionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {car ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {car.year} {car.make} {car.model}
                {car.trim && <span className="text-muted-foreground"> · {car.trim}</span>}
              </DialogTitle>
              <DialogDescription>
                In stock {car.daysInStock} days · {formatCurrency(car.price)} · VIN {car.vin}
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold">Action history</h4>
              <ActionHistory logs={car.actionLogs} />
            </section>

            <section className="space-y-2 border-t pt-3">
              <h4 className="text-sm font-semibold">Log new action</h4>
              <AddActionForm dealershipId={dealershipId} carId={car.id} />
            </section>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
