"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { trpc } from "~/trpc/react";
import { toast } from "sonner";

interface RevokeSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string | null;
  userEmail: string;
}

export function RevokeSubscriptionDialog({
  open,
  onClose,
  userId,
  userName,
  userEmail,
}: RevokeSubscriptionDialogProps) {
  const [note, setNote] = useState("");

  const utils = trpc.useUtils();

  const { mutate: revokeSubscription, isPending } =
    trpc.user.revokeUserSubscription.useMutation({
      onSuccess: () => {
        toast.success(`Subscription revoked for ${userName ?? userEmail}`);
        utils.analytics.getUsers.invalidate();
        handleClose();
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to revoke subscription");
      },
    });

  const handleClose = () => {
    setNote("");
    onClose();
  };

  const handleConfirm = () => {
    revokeSubscription({
      userId,
      note: note.trim() || "Revoked by admin",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <DialogTitle>Revoke Subscription</DialogTitle>
          </div>
          <DialogDescription>
            You are about to revoke the subscription for{" "}
            <span className="text-foreground font-medium">
              {userName ?? userEmail}
            </span>
            . This will immediately deactivate their access. They will receive
            an email notification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="revoke-note" className="text-sm">
            Reason{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            id="revoke-note"
            placeholder="e.g. Payment dispute, Terms of service violation…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[90px] resize-none text-sm"
          />
          <p className="text-muted-foreground text-xs">
            If left empty, a generic reason will be used. This note will be
            included in the email sent to the user.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            className="ml-2"
          >
            {isPending ? "Revoking…" : "Revoke Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
