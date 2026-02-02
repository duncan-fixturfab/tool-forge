"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MachineRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: MachineRequestData) => void;
}

interface MachineRequestData {
  manufacturer: string;
  model: string;
  maxRpm: number;
  spindlePowerKw?: number;
  toolHolderType?: string;
  notes?: string;
}

export function MachineRequestForm({
  open,
  onOpenChange,
  onSubmit,
}: MachineRequestFormProps) {
  const [formData, setFormData] = useState<Partial<MachineRequestData>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // In production, this would submit to an API
    if (onSubmit && formData.manufacturer && formData.model && formData.maxRpm) {
      onSubmit(formData as MachineRequestData);
    }

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLoading(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after closing
    setTimeout(() => {
      setFormData({});
      setSubmitted(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Request Submitted</DialogTitle>
              <DialogDescription>
                We&apos;ve received your machine request. We&apos;ll review it
                and add it to our database soon. You&apos;ll be notified when
                it&apos;s available.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request New Machine</DialogTitle>
              <DialogDescription>
                Can&apos;t find your CNC machine? Request it to be added to our
                database.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., Haas, Tormach, Carbide 3D"
                    value={formData.manufacturer || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="e.g., VF-2, PCNC 770, Shapeoko 4"
                    value={formData.model || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maxRpm">Max Spindle RPM *</Label>
                    <Input
                      id="maxRpm"
                      type="number"
                      placeholder="e.g., 10000"
                      value={formData.maxRpm || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxRpm: parseInt(e.target.value),
                        })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="spindlePower">Spindle Power (kW)</Label>
                    <Input
                      id="spindlePower"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 2.2"
                      value={formData.spindlePowerKw || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          spindlePowerKw: parseFloat(e.target.value),
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="toolHolder">Tool Holder Type</Label>
                  <Input
                    id="toolHolder"
                    placeholder="e.g., ER20, CAT40, BT30"
                    value={formData.toolHolderType || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        toolHolderType: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Any other relevant specifications..."
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
